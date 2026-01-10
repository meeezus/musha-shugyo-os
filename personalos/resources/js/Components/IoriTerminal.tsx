import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { X, Terminal, RefreshCw, ChevronDown, Minus } from 'lucide-react';

interface IoriTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModelName = 'sonnet' | 'opus' | 'haiku';

const MODEL_LABELS: Record<ModelName, string> = {
  sonnet: 'Sonnet',
  opus: 'Opus',
  haiku: 'Haiku',
};

// Detect mobile
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export default function IoriTerminal({ isOpen, onClose }: IoriTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [currentModel, setCurrentModel] = useState<ModelName>('sonnet');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mobile, setMobile] = useState(isMobile());

  // Track mobile state
  useEffect(() => {
    const handleResize = () => setMobile(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const connect = () => {
    console.log('[IoriTerminal] connect() called, current state:', wsRef.current?.readyState);
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    // Use same hostname as the page (works for both localhost and LAN IP)
    const wsHost = window.location.hostname;
    const wsUrl = `ws://${wsHost}:3004`;
    console.log('[IoriTerminal] Creating WebSocket to', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[IoriTerminal] WebSocket opened');
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'output':
            xtermRef.current?.write(msg.data);
            break;
          case 'ready':
            console.log('[IoriTerminal] Terminal ready, model:', msg.model);
            if (msg.model) setCurrentModel(msg.model);
            break;
          case 'modelChanged':
            console.log('[IoriTerminal] Model changed to:', msg.model);
            setCurrentModel(msg.model);
            break;
          case 'modelInfo':
            console.log('[IoriTerminal] Model info:', msg);
            if (msg.model) setCurrentModel(msg.model);
            break;
          case 'exit':
            console.log('[IoriTerminal] Process exited:', msg.code);
            setStatus('disconnected');
            break;
        }
      } catch (err) {
        console.error('[IoriTerminal] Error parsing message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[IoriTerminal] WebSocket closed, code:', event.code, 'reason:', event.reason);
      setStatus('disconnected');
    };

    ws.onerror = (err) => {
      console.error('[IoriTerminal] WebSocket error:', err);
      console.error('[IoriTerminal] WebSocket readyState:', ws.readyState);
      setStatus('error');
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const reconnect = () => {
    disconnect();
    xtermRef.current?.clear();
    setTimeout(connect, 100);
  };

  const changeModel = (model: ModelName) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'setModel', model }));
    }
    setShowModelMenu(false);
  };

  useEffect(() => {
    if (!isOpen || !terminalRef.current || isMinimized) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        cursor: '#10b981',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#10b98140',
        black: '#1a1a1a',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#e5e5e5',
        brightBlack: '#404040',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#a78bfa',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Focus the terminal so it receives keyboard input
    term.focus();

    // Handle user input - send to server (server handles echo)
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial resize after a short delay
    setTimeout(handleResize, 100);

    // Connect to terminal server
    connect();

    return () => {
      window.removeEventListener('resize', handleResize);
      disconnect();
      term.dispose();
    };
  }, [isOpen, isMinimized]);

  // Refit when panel opens or unminimizes
  useEffect(() => {
    if (isOpen && !isMinimized && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [isOpen, isMinimized]);

  // Close model menu when clicking outside
  useEffect(() => {
    if (!showModelMenu) return;
    const handleClick = () => setShowModelMenu(false);
    // Delay to allow the menu button click to complete
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [showModelMenu]);

  if (!isOpen) return null;

  // Mobile: floating modal at bottom
  if (mobile) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 16px)',
        maxWidth: '600px',
        height: isMinimized ? 'auto' : '450px',
        maxHeight: '70vh',
        backgroundColor: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 60px rgba(16, 185, 129, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#0f0f0f',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} style={{ color: '#10b981' }} />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
              CC
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '2px',
              fontFamily: 'monospace',
              backgroundColor: status === 'connected' ? 'rgba(16, 185, 129, 0.2)' :
                             status === 'connecting' ? 'rgba(245, 158, 11, 0.2)' :
                             'rgba(239, 68, 68, 0.2)',
              color: status === 'connected' ? '#10b981' :
                     status === 'connecting' ? '#f59e0b' :
                     '#ef4444',
              border: `1px solid ${status === 'connected' ? 'rgba(16, 185, 129, 0.3)' :
                                  status === 'connecting' ? 'rgba(245, 158, 11, 0.3)' :
                                  'rgba(239, 68, 68, 0.3)'}`,
            }}>
              {status.toUpperCase()}
            </span>
          </div>

          {/* Model Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '3px',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
              title="Change model"
            >
              {MODEL_LABELS[currentModel]}
              <ChevronDown size={12} />
            </button>

            {showModelMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                zIndex: 10000,
                minWidth: '100px',
              }}>
                {(['sonnet', 'opus', 'haiku'] as ModelName[]).map((model) => (
                  <button
                    key={model}
                    onClick={() => changeModel(model)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      textAlign: 'left',
                      backgroundColor: currentModel === model ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      border: 'none',
                      color: currentModel === model ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {MODEL_LABELS[model]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={reconnect}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
              title="Reconnect"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Terminal */}
        {!isMinimized && (
          <>
            <div
              ref={terminalRef}
              onClick={() => xtermRef.current?.focus()}
              style={{
                flex: 1,
                padding: '8px',
                overflow: 'hidden',
                cursor: 'text',
              }}
            />

            {/* Footer hint */}
            <div style={{
              padding: '4px 12px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              backgroundColor: '#0f0f0f',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.3)',
            }}>
              Claude Pro
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop: right sidebar like JFDI
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: '#0f0f0f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} style={{ color: '#10b981' }} />
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', fontFamily: 'monospace' }}>
            IORI
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '2px',
            fontFamily: 'monospace',
            backgroundColor: status === 'connected' ? 'rgba(16, 185, 129, 0.2)' :
                           status === 'connecting' ? 'rgba(245, 158, 11, 0.2)' :
                           'rgba(239, 68, 68, 0.2)',
            color: status === 'connected' ? '#10b981' :
                   status === 'connecting' ? '#f59e0b' :
                   '#ef4444',
            border: `1px solid ${status === 'connected' ? 'rgba(16, 185, 129, 0.3)' :
                                status === 'connecting' ? 'rgba(245, 158, 11, 0.3)' :
                                'rgba(239, 68, 68, 0.3)'}`,
          }}>
            {status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Model Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '3px',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
              title="Change model"
            >
              {MODEL_LABELS[currentModel]}
              <ChevronDown size={12} />
            </button>

            {showModelMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                zIndex: 10000,
                minWidth: '100px',
              }}>
                {(['sonnet', 'opus', 'haiku'] as ModelName[]).map((model) => (
                  <button
                    key={model}
                    onClick={() => changeModel(model)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      textAlign: 'left',
                      backgroundColor: currentModel === model ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      border: 'none',
                      color: currentModel === model ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {MODEL_LABELS[model]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={reconnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
            title="Reconnect"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        onClick={() => xtermRef.current?.focus()}
        style={{
          flex: 1,
          padding: '8px',
          overflow: 'hidden',
          cursor: 'text',
          display: isMinimized ? 'none' : 'block',
        }}
      />

      {/* Footer hint */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0f0f0f',
        fontSize: '10px',
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.3)',
        display: isMinimized ? 'none' : 'block',
      }}>
        Claude Pro • Type naturally to chat
      </div>
    </div>
  );
}
