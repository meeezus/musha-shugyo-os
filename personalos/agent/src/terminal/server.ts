import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { ensureAuth, startMonitoring, getStatus, triggerLogin } from './oauth-monitor';

const PORT = parseInt(process.env.TERMINAL_PORT || '3004', 10);

// Available models for Claude CLI
const AVAILABLE_MODELS = ['sonnet', 'opus', 'haiku'] as const;
type ModelName = typeof AVAILABLE_MODELS[number];
const DEFAULT_MODEL: ModelName = 'sonnet';

interface TerminalSession {
  ws: WebSocket;
  pty: pty.IPty | null;
  model: ModelName;
  isStarting: boolean;
}

const sessions = new Map<WebSocket, TerminalSession>();

// Spawn interactive Claude Code session
function spawnClaude(ws: WebSocket, model: ModelName): pty.IPty | null {
  const session = sessions.get(ws);
  if (!session) return null;

  // Check OAuth status before spawning
  const authStatus = getStatus();
  if (!authStatus.valid) {
    console.log('[terminal] OAuth token invalid, triggering login...');
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'output',
        data: '\x1b[33m🔐 Checking authentication...\x1b[0m\r\n'
      }));
    }

    // Try to refresh/login
    triggerLogin().then(success => {
      if (success) {
        // Retry spawning after successful auth
        setTimeout(() => {
          const newPty = spawnClaude(ws, model);
          if (newPty && session) {
            session.pty = newPty;
          }
        }, 1000);
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: '\x1b[31m⚠️  Authentication failed. Run "claude login" in your terminal.\x1b[0m\r\n'
        }));
      }
    });
    return null;
  }

  console.log(`[terminal] Spawning interactive Claude Code (model: ${model})`);

  // Environment setup - use subscription auth (no API key)
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY; // Force subscription auth
  delete env.CLAUDE_CODE_OAUTH_TOKEN; // Force keychain read

  // Add PATH to ensure claude is found
  env.PATH = `/opt/homebrew/bin:/usr/local/bin:${env.PATH}`;

  try {
    // Spawn interactive Claude Code with PTY
    // Spawn node directly with the CLI script (more reliable than shell wrapper)
    const ptyProcess = pty.spawn('/opt/homebrew/bin/node', [
      '/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/cli.js',
      '--model', model,
      '--dangerously-skip-permissions'
    ], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: '/Users/michaelenriquez/PersonalOS',
      env: env as { [key: string]: string },
    });

    console.log(`[terminal] Claude Code spawned with PID: ${ptyProcess.pid}`);

    // Stream output to WebSocket
    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[terminal] Claude Code exited (code: ${exitCode}, signal: ${signal})`);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: `\r\n\x1b[90m[Session ended - code ${exitCode}]\x1b[0m\r\n`
        }));
        ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      }

      // Clear PTY reference
      const sess = sessions.get(ws);
      if (sess) {
        sess.pty = null;
      }
    });

    return ptyProcess;
  } catch (err) {
    console.error('[terminal] Failed to spawn Claude:', err);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'output',
        data: `\r\n\x1b[31mError spawning Claude: ${err}\x1b[0m\r\n`
      }));
    }
    return null;
  }
}

function startTerminalServer(): void {
  // Start OAuth monitoring in background (check every 5 minutes)
  console.log('🔐 Starting OAuth monitor...');
  startMonitoring(5 * 60 * 1000);

  const wss = new WebSocketServer({ port: PORT });

  console.log(`\n🖥️  Terminal server running on ws://localhost:${PORT}`);
  console.log(`   Full interactive Claude Code with your Pro subscription\n`);

  wss.on('connection', (ws: WebSocket) => {
    console.log('[terminal] New connection');

    // Initialize session
    const session: TerminalSession = {
      ws,
      pty: null,
      model: DEFAULT_MODEL,
      isStarting: true,
    };
    sessions.set(ws, session);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'output',
      data: '\x1b[36m✦ Claude Code Terminal\x1b[0m\r\n' +
            '\x1b[90mFull CLI • Plugins enabled • Type naturally\x1b[0m\r\n\r\n'
    }));

    // Send ready message with model info
    ws.send(JSON.stringify({
      type: 'ready',
      model: DEFAULT_MODEL,
      availableModels: AVAILABLE_MODELS,
    }));

    // Spawn Claude Code
    session.pty = spawnClaude(ws, session.model);
    session.isStarting = false;

    // Handle WebSocket messages
    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());
        const sess = sessions.get(ws);
        if (!sess) return;

        switch (msg.type) {
          case 'input':
            // Forward input directly to PTY
            if (sess.pty) {
              sess.pty.write(msg.data);
            } else if (!sess.isStarting) {
              // PTY not running, try to restart
              ws.send(JSON.stringify({
                type: 'output',
                data: '\r\n\x1b[33mRestarting Claude Code...\x1b[0m\r\n'
              }));
              sess.isStarting = true;
              sess.pty = spawnClaude(ws, sess.model);
              sess.isStarting = false;
            }
            break;

          case 'resize':
            // Handle terminal resize
            if (sess.pty && msg.cols && msg.rows) {
              sess.pty.resize(msg.cols, msg.rows);
              console.log(`[terminal] Resized to ${msg.cols}x${msg.rows}`);
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          case 'setModel':
            const newModel = msg.model as string;
            if (AVAILABLE_MODELS.includes(newModel as ModelName)) {
              sess.model = newModel as ModelName;
              console.log('[terminal] Model changed to:', newModel);

              // Kill current session and restart with new model
              if (sess.pty) {
                sess.pty.kill();
              }

              ws.send(JSON.stringify({
                type: 'modelChanged',
                model: newModel,
              }));
              ws.send(JSON.stringify({
                type: 'output',
                data: `\r\n\x1b[36m✓ Switching to ${newModel}...\x1b[0m\r\n\r\n`
              }));

              // Spawn new session with new model
              setTimeout(() => {
                sess.pty = spawnClaude(ws, sess.model);
              }, 500);
            } else {
              ws.send(JSON.stringify({
                type: 'output',
                data: `\r\n\x1b[31m✗ Invalid model: ${newModel}. Available: ${AVAILABLE_MODELS.join(', ')}\x1b[0m\r\n`
              }));
            }
            break;

          case 'getModel':
            ws.send(JSON.stringify({
              type: 'modelInfo',
              model: sess.model,
              availableModels: AVAILABLE_MODELS,
            }));
            break;

          case 'restart':
            // Force restart the session
            if (sess.pty) {
              sess.pty.kill();
            }
            ws.send(JSON.stringify({
              type: 'output',
              data: '\r\n\x1b[33mRestarting Claude Code...\x1b[0m\r\n\r\n'
            }));
            setTimeout(() => {
              sess.pty = spawnClaude(ws, sess.model);
            }, 500);
            break;

          default:
            console.log('[terminal] Unknown message type:', msg.type);
        }
      } catch (err) {
        console.error('[terminal] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      console.log('[terminal] Connection closed');
      const sess = sessions.get(ws);
      if (sess?.pty) {
        sess.pty.kill();
      }
      sessions.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[terminal] WebSocket error:', err);
    });
  });

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    console.log('[terminal] Shutting down...');
    // Kill all PTY sessions
    sessions.forEach((sess) => {
      if (sess.pty) {
        sess.pty.kill();
      }
    });
    wss.close();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[terminal] Interrupted, shutting down...');
    sessions.forEach((sess) => {
      if (sess.pty) {
        sess.pty.kill();
      }
    });
    wss.close();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  startTerminalServer();
}

export { startTerminalServer };
