import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { triggerLoginWithHelpers, testAuth, sendNotification } from './login-helper';
import { ensureValidToken, readTokensFromKeychain, isTokenExpired } from './oauth-refresh';

const execAsync = promisify(exec);

// ============================================
// OAUTH MONITOR AGENT
// ============================================
// Monitors Claude CLI OAuth token status and automatically
// refreshes tokens using the refresh token (no browser needed).
// Falls back to browser login only if refresh token is invalid.

interface OAuthStatus {
  valid: boolean;
  expiresAt?: Date;
  lastChecked: Date;
  error?: string;
}

let currentStatus: OAuthStatus = {
  valid: false,
  lastChecked: new Date(),
};

let isRefreshing = false;
let refreshCallbacks: Array<(success: boolean) => void> = [];

// Check if OAuth token is valid using keychain (fast, no CLI call)
async function checkOAuthStatus(): Promise<OAuthStatus> {
  try {
    // Fast keychain-based check first
    const tokens = await readTokensFromKeychain();

    if (!tokens) {
      currentStatus = {
        valid: false,
        lastChecked: new Date(),
        error: 'No tokens in keychain',
      };
      console.log('[oauth-monitor] No tokens found in keychain');
      return currentStatus;
    }

    if (!isTokenExpired(tokens)) {
      currentStatus = {
        valid: true,
        lastChecked: new Date(),
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : undefined,
      };

      // Log time until expiry
      if (tokens.expiresAt) {
        const minutesUntilExpiry = Math.round((tokens.expiresAt - Date.now()) / 60000);
        console.log(`[oauth-monitor] Token valid, expires in ${minutesUntilExpiry} minutes`);
      } else {
        console.log('[oauth-monitor] Token appears valid (no expiry set)');
      }
      return currentStatus;
    }

    // Token expired or about to expire
    currentStatus = {
      valid: false,
      lastChecked: new Date(),
      error: 'Token expired or expiring soon',
    };
    console.log('[oauth-monitor] Token has expired or is expiring soon');
  } catch (error: any) {
    currentStatus = {
      valid: false,
      lastChecked: new Date(),
      error: String(error).substring(0, 100),
    };
    console.error('[oauth-monitor] Check failed:', currentStatus.error);
  }

  return currentStatus;
}

// Try automatic token refresh first, fall back to browser login if needed
async function triggerLogin(): Promise<boolean> {
  if (isRefreshing) {
    console.log('[oauth-monitor] Refresh already in progress, waiting...');
    return new Promise((resolve) => {
      refreshCallbacks.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    // First, try automatic token refresh (no browser needed!)
    console.log('[oauth-monitor] Attempting automatic token refresh...');
    const newToken = await ensureValidToken();

    if (newToken) {
      console.log('[oauth-monitor] ✓ Token refreshed automatically!');
      currentStatus = { valid: true, lastChecked: new Date() };
      isRefreshing = false;
      refreshCallbacks.forEach(cb => cb(true));
      refreshCallbacks = [];
      return true;
    }

    // Automatic refresh failed - fall back to browser login
    console.log('[oauth-monitor] Auto-refresh failed, falling back to browser login...');
    sendNotification('Claude Login Required', 'Auto-refresh failed. Please authenticate in browser.');

    const success = await triggerLoginWithHelpers({
      onLoginRequired: () => {
        console.log('[oauth-monitor] Login required - browser should open');
      },
      onLoginSuccess: () => {
        console.log('[oauth-monitor] Login completed successfully');
        currentStatus = { valid: true, lastChecked: new Date() };
      },
      onLoginFailed: () => {
        console.log('[oauth-monitor] Login failed or timed out');
      },
    });

    isRefreshing = false;

    // Notify waiting callbacks
    refreshCallbacks.forEach(cb => cb(success));
    refreshCallbacks = [];

    return success;
  } catch (error) {
    console.error('[oauth-monitor] Refresh/Login error:', error);
    isRefreshing = false;
    refreshCallbacks.forEach(cb => cb(false));
    refreshCallbacks = [];
    return false;
  }
}

// Ensure OAuth is valid, triggering login if needed
async function ensureAuth(): Promise<boolean> {
  const status = await checkOAuthStatus();

  if (status.valid) {
    return true;
  }

  console.log('[oauth-monitor] Auth invalid, triggering login...');
  return triggerLogin();
}

// Start periodic monitoring
let monitorInterval: NodeJS.Timeout | null = null;

function startMonitoring(intervalMs: number = 5 * 60 * 1000): void {
  if (monitorInterval) {
    console.log('[oauth-monitor] Monitor already running');
    return;
  }

  console.log(`[oauth-monitor] Starting periodic monitoring (every ${intervalMs / 1000}s)`);

  // Check immediately
  checkOAuthStatus();

  // Then check periodically
  monitorInterval = setInterval(async () => {
    const status = await checkOAuthStatus();

    if (!status.valid) {
      console.log('[oauth-monitor] Token expired during monitoring, triggering auto-login');
      // Open browser for login automatically
      triggerLogin();
    }
  }, intervalMs);
}

function stopMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[oauth-monitor] Monitoring stopped');
  }
}

// Get current status
function getStatus(): OAuthStatus {
  return { ...currentStatus };
}

// Export functions
export {
  checkOAuthStatus,
  triggerLogin,
  ensureAuth,
  startMonitoring,
  stopMonitoring,
  getStatus,
  OAuthStatus,
};

// Run if executed directly
if (require.main === module) {
  console.log('🔐 OAuth Monitor Agent starting...\n');

  // Check status first
  checkOAuthStatus().then(status => {
    console.log('Current status:', status);

    if (!status.valid) {
      console.log('\nToken is invalid, triggering login...');
      triggerLogin().then(success => {
        console.log('Login result:', success ? 'SUCCESS' : 'FAILED');
        process.exit(success ? 0 : 1);
      });
    } else {
      console.log('\nToken is valid, starting monitoring...');
      startMonitoring(60000); // Check every minute when running standalone
    }
  });
}
