import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ override: true, path: path.join(__dirname, '../../.env') });

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import chokidar from 'chokidar';

const execAsync = promisify(exec);

// Debounce helper for file watching
let restartTimeout: NodeJS.Timeout | null = null;
const RESTART_DEBOUNCE_MS = 1000; // Wait 1 second after last change before restarting

const MSOS_ROOT = '/Users/michaelenriquez/PersonalOS/personalos';
const LARAVEL_PORT = 8000;
const VITE_PORT = 5173;
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const LOCAL_IP = '192.168.1.38';

interface ServiceStatus {
  name: string;
  running: boolean;
  port: number;
  pid?: number;
}

async function checkPort(port: number): Promise<{ running: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -t 2>/dev/null | head -1`);
    const pid = parseInt(stdout.trim());
    return { running: !isNaN(pid), pid: isNaN(pid) ? undefined : pid };
  } catch {
    return { running: false };
  }
}

async function checkHttpHealth(url: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${url}" --max-time 5`);
    const statusCode = parseInt(stdout.trim());
    return statusCode >= 200 && statusCode < 500;
  } catch {
    return false;
  }
}

async function startLaravel(): Promise<void> {
  logger.info('[MSOS Monitor] Starting Laravel server...');

  const laravelProcess = spawn('php', ['artisan', 'serve', '--host=0.0.0.0', `--port=${LARAVEL_PORT}`], {
    cwd: MSOS_ROOT,
    detached: true,
    stdio: 'ignore',
  });

  laravelProcess.unref();

  // Wait for it to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  logger.info('[MSOS Monitor] Laravel server started');
}

async function startVite(): Promise<void> {
  logger.info('[MSOS Monitor] Starting Vite dev server...');

  // Remove stale hot file
  await execAsync(`rm -f ${MSOS_ROOT}/public/hot`).catch(() => {});

  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: MSOS_ROOT,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });

  viteProcess.unref();

  // Wait for it to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  logger.info('[MSOS Monitor] Vite dev server started');
}

async function getStatus(): Promise<{ laravel: ServiceStatus; vite: ServiceStatus }> {
  const [laravelPort, vitePort] = await Promise.all([
    checkPort(LARAVEL_PORT),
    checkPort(VITE_PORT),
  ]);

  // Also check HTTP health
  const [laravelHealth, viteHealth] = await Promise.all([
    checkHttpHealth(`http://${LOCAL_IP}:${LARAVEL_PORT}`),
    checkHttpHealth(`http://${LOCAL_IP}:${VITE_PORT}/@vite/client`),
  ]);

  return {
    laravel: {
      name: 'Laravel',
      running: laravelPort.running && laravelHealth,
      port: LARAVEL_PORT,
      pid: laravelPort.pid,
    },
    vite: {
      name: 'Vite',
      running: vitePort.running && viteHealth,
      port: VITE_PORT,
      pid: vitePort.pid,
    },
  };
}

async function monitor(): Promise<void> {
  logger.info('[MSOS Monitor] Starting health check...');

  const status = await getStatus();

  logger.info(`[MSOS Monitor] Laravel: ${status.laravel.running ? 'UP' : 'DOWN'} (port ${LARAVEL_PORT})`);
  logger.info(`[MSOS Monitor] Vite: ${status.vite.running ? 'UP' : 'DOWN'} (port ${VITE_PORT})`);

  if (!status.laravel.running) {
    logger.warn('[MSOS Monitor] Laravel is down, restarting...');
    await startLaravel();
  }

  if (!status.vite.running) {
    logger.warn('[MSOS Monitor] Vite is down, restarting...');
    await startVite();
  }

  if (status.laravel.running && status.vite.running) {
    logger.info('[MSOS Monitor] All services healthy');
  }
}

async function restartLaravelDebounced(): Promise<void> {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }

  restartTimeout = setTimeout(async () => {
    logger.info('[MSOS Monitor] PHP file changed, restarting Laravel...');

    // Kill existing Laravel process
    await execAsync(`lsof -i :${LARAVEL_PORT} -t | xargs kill -9 2>/dev/null || true`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start fresh
    await startLaravel();
    logger.info('[MSOS Monitor] Laravel restarted after PHP change');
  }, RESTART_DEBOUNCE_MS);
}

function startPhpFileWatcher(): void {
  const watchPaths = [
    `${MSOS_ROOT}/app/**/*.php`,
    `${MSOS_ROOT}/config/**/*.php`,
    `${MSOS_ROOT}/routes/**/*.php`,
    `${MSOS_ROOT}/database/**/*.php`,
  ];

  logger.info('[MSOS Monitor] Starting PHP file watcher...');

  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't trigger on initial scan
  });

  watcher.on('change', (filePath) => {
    logger.info(`[MSOS Monitor] PHP file changed: ${path.basename(filePath)}`);
    restartLaravelDebounced();
  });

  watcher.on('add', (filePath) => {
    logger.info(`[MSOS Monitor] PHP file added: ${path.basename(filePath)}`);
    restartLaravelDebounced();
  });

  watcher.on('error', (error) => {
    logger.error('[MSOS Monitor] File watcher error:', error);
  });

  logger.info('[MSOS Monitor] PHP file watcher active');
}

async function runDaemon(): Promise<void> {
  logger.info('[MSOS Monitor] Starting daemon mode...');
  logger.info(`[MSOS Monitor] Monitoring Laravel (:${LARAVEL_PORT}) and Vite (:${VITE_PORT})`);
  logger.info(`[MSOS Monitor] Check interval: ${CHECK_INTERVAL_MS / 1000}s`);

  // Initial check
  await monitor();

  // Start PHP file watcher for auto-restart on code changes
  startPhpFileWatcher();

  // Continuous monitoring
  setInterval(async () => {
    try {
      await monitor();
    } catch (error) {
      logger.error('[MSOS Monitor] Error during health check:', error);
    }
  }, CHECK_INTERVAL_MS);
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--daemon') || args.includes('-d')) {
    await runDaemon();
  } else if (args.includes('--status') || args.includes('-s')) {
    const status = await getStatus();
    console.log('\nMSOS Service Status:');
    console.log('====================');
    console.log(`Laravel: ${status.laravel.running ? '✓ UP' : '✗ DOWN'} (port ${LARAVEL_PORT}, PID: ${status.laravel.pid || 'N/A'})`);
    console.log(`Vite:    ${status.vite.running ? '✓ UP' : '✗ DOWN'} (port ${VITE_PORT}, PID: ${status.vite.pid || 'N/A'})`);
    console.log(`\nAccess: http://${LOCAL_IP}:${LARAVEL_PORT}`);
  } else if (args.includes('--restart') || args.includes('-r')) {
    logger.info('[MSOS Monitor] Force restart requested...');

    // Kill existing processes
    await execAsync(`lsof -i :${LARAVEL_PORT} -t | xargs kill -9 2>/dev/null || true`);
    await execAsync(`lsof -i :${VITE_PORT} -t | xargs kill -9 2>/dev/null || true`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start fresh
    await startLaravel();
    await startVite();

    logger.info('[MSOS Monitor] Services restarted');
  } else {
    // Single check and fix
    await monitor();
  }
}

main().catch(error => {
  logger.error('[MSOS Monitor] Fatal error:', error);
  process.exit(1);
});
