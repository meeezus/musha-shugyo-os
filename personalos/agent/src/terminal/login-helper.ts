import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================
// LOGIN HELPER
// ============================================
// Assists with OAuth login by:
// 1. Opening browser automatically
// 2. Sending desktop notification
// 3. Polling for successful login
// 4. Notifying when complete

interface LoginHelperOptions {
  onLoginRequired?: () => void;
  onLoginSuccess?: () => void;
  onLoginFailed?: () => void;
  pollInterval?: number;
  maxPollAttempts?: number;
}

// Send macOS desktop notification
async function sendNotification(title: string, message: string): Promise<void> {
  try {
    const script = `display notification "${message}" with title "${title}" sound name "Ping"`;
    await execAsync(`osascript -e '${script}'`);
    console.log('[login-helper] Sent notification:', title);
  } catch (e) {
    console.log('[login-helper] Could not send notification');
  }
}

// Open browser to Claude login
async function openLoginPage(): Promise<void> {
  try {
    // Start claude /login in background - this handles the OAuth flow
    const loginProc = spawn('claude', ['/login'], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    loginProc.unref();

    console.log('[login-helper] Started claude /login process');
  } catch (e) {
    console.error('[login-helper] Failed to start login:', e);
  }
}

// Test if OAuth token is valid
async function testAuth(): Promise<boolean> {
  try {
    const { stdout, stderr } = await execAsync(
      'claude --print --model haiku "ok"',
      {
        timeout: 30000,
        env: { ...process.env, ANTHROPIC_API_KEY: undefined }
      }
    );

    // Check for auth errors
    if (stderr?.includes('401') || stderr?.includes('OAuth token has expired')) {
      return false;
    }

    // If we got output, auth is good
    return stdout.length > 0;
  } catch (error: any) {
    const msg = error.stderr || error.message || '';
    return !msg.includes('401') && !msg.includes('OAuth');
  }
}

// Poll for successful login
async function waitForLogin(options: LoginHelperOptions = {}): Promise<boolean> {
  const pollInterval = options.pollInterval || 5000;
  const maxAttempts = options.maxPollAttempts || 60; // 5 minutes at 5s intervals

  console.log('[login-helper] Waiting for login completion...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, pollInterval));

    const isValid = await testAuth();
    if (isValid) {
      console.log('[login-helper] Login successful!');
      await sendNotification('Iori', '✓ Login successful! Terminal ready.');
      options.onLoginSuccess?.();
      return true;
    }

    if (attempt % 12 === 0) { // Every minute
      console.log(`[login-helper] Still waiting for login... (${attempt * pollInterval / 1000}s)`);
    }
  }

  console.log('[login-helper] Login timed out');
  options.onLoginFailed?.();
  return false;
}

// Main function: trigger login flow with all helpers
async function triggerLoginWithHelpers(options: LoginHelperOptions = {}): Promise<boolean> {
  console.log('[login-helper] Triggering assisted login flow');

  // Notify user
  await sendNotification(
    'Iori - Login Required',
    'Claude OAuth expired. Browser opening for re-authentication...'
  );

  options.onLoginRequired?.();

  // Open login
  await openLoginPage();

  // Wait for completion
  return waitForLogin(options);
}

// Check and login if needed
async function ensureAuthWithHelpers(options: LoginHelperOptions = {}): Promise<boolean> {
  const isValid = await testAuth();

  if (isValid) {
    console.log('[login-helper] Auth is valid');
    return true;
  }

  console.log('[login-helper] Auth invalid, triggering login');
  return triggerLoginWithHelpers(options);
}

export {
  sendNotification,
  openLoginPage,
  testAuth,
  waitForLogin,
  triggerLoginWithHelpers,
  ensureAuthWithHelpers,
};

// Run if executed directly
if (require.main === module) {
  console.log('🔐 Login Helper starting...\n');

  ensureAuthWithHelpers({
    onLoginRequired: () => console.log('→ Please complete login in browser'),
    onLoginSuccess: () => console.log('→ All done! Terminal is ready.'),
    onLoginFailed: () => console.log('→ Login failed or timed out'),
  }).then(success => {
    process.exit(success ? 0 : 1);
  });
}
