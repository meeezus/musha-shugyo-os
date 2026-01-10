import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ============================================
// OAUTH TOKEN REFRESH
// ============================================
// Automatically refresh Claude Pro OAuth tokens using the refresh token
// Based on: https://github.com/RavenStorm-bit/claude-token-refresh
//
// Claude stores tokens in macOS Keychain under "Claude Code-credentials"

const ANTHROPIC_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const ANTHROPIC_TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number; // Unix timestamp ms
}

interface ClaudeAiOauth {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  scopes?: string[];
  subscriptionType?: string;
  rateLimitTier?: string;
}

const KEYCHAIN_SERVICE = 'Claude Code-credentials';

// Read OAuth tokens from macOS Keychain
async function readTokensFromKeychain(): Promise<OAuthTokens | null> {
  if (process.platform !== 'darwin') {
    console.log('[oauth-refresh] Keychain only available on macOS');
    return null;
  }

  try {
    const { stdout } = await execAsync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -g 2>&1`
    );

    // Extract the password line
    const passwordMatch = stdout.match(/password: "(.+)"/);
    if (!passwordMatch) {
      console.log('[oauth-refresh] No password found in keychain');
      return null;
    }

    const passwordJson = passwordMatch[1];
    const data = JSON.parse(passwordJson) as { claudeAiOauth?: ClaudeAiOauth };

    if (!data.claudeAiOauth?.accessToken || !data.claudeAiOauth?.refreshToken) {
      console.log('[oauth-refresh] Missing tokens in keychain data');
      return null;
    }

    return {
      accessToken: data.claudeAiOauth.accessToken,
      refreshToken: data.claudeAiOauth.refreshToken,
      expiresAt: data.claudeAiOauth.expiresAt,
    };
  } catch (error) {
    console.error('[oauth-refresh] Failed to read from keychain:', error);
    return null;
  }
}

// Write updated tokens to macOS Keychain
async function writeTokensToKeychain(tokens: OAuthTokens): Promise<boolean> {
  if (process.platform !== 'darwin') {
    console.log('[oauth-refresh] Keychain only available on macOS');
    return false;
  }

  try {
    // First read existing data to preserve other fields
    const { stdout } = await execAsync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -g 2>&1`
    );

    const passwordMatch = stdout.match(/password: "(.+)"/);
    let existingData: { claudeAiOauth?: ClaudeAiOauth } = {};

    if (passwordMatch) {
      try {
        existingData = JSON.parse(passwordMatch[1]);
      } catch {
        // Start fresh if parsing fails
      }
    }

    // Update tokens while preserving other fields
    const newData = {
      ...existingData,
      claudeAiOauth: {
        ...existingData.claudeAiOauth,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    };

    const newPassword = JSON.stringify(newData);

    // Delete old entry and add new one
    try {
      await execAsync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}"`);
    } catch {
      // May not exist, that's fine
    }

    // Get current user account name
    const username = os.userInfo().username;

    await execAsync(
      `security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${username}" -w '${newPassword.replace(/'/g, "'\\''")}'`
    );

    console.log('[oauth-refresh] Tokens updated in keychain');
    return true;
  } catch (error) {
    console.error('[oauth-refresh] Failed to write to keychain:', error);
    return false;
  }
}

// Check if token is expired or about to expire (within 5 min)
function isTokenExpired(tokens: OAuthTokens): boolean {
  if (!tokens.expiresAt) {
    // If no expiry, assume might be expired
    return true;
  }
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return tokens.expiresAt < (now + fiveMinutes);
}

// Refresh the OAuth token using the refresh token
async function refreshToken(refreshToken: string): Promise<OAuthTokens | null> {
  try {
    console.log('[oauth-refresh] Refreshing OAuth token...');

    const response = await fetch(ANTHROPIC_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: ANTHROPIC_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[oauth-refresh] Refresh failed:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      console.error('[oauth-refresh] No access token in response');
      return null;
    }

    // Calculate expiry (usually 1 hour from now, but use expires_in if provided)
    const expiresIn = data.expires_in || 3600; // Default to 1 hour
    const expiresAt = Date.now() + (expiresIn * 1000);

    console.log('[oauth-refresh] Token refreshed successfully, expires in', expiresIn, 'seconds');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Keep old if not returned
      expiresAt,
    };
  } catch (error) {
    console.error('[oauth-refresh] Refresh error:', error);
    return null;
  }
}

// Main function: ensure we have a valid token
async function ensureValidToken(): Promise<string | null> {
  const tokens = await readTokensFromKeychain();
  if (!tokens) {
    console.log('[oauth-refresh] Could not read tokens from keychain');
    return null;
  }

  // If token is not expired, return it
  if (!isTokenExpired(tokens)) {
    console.log('[oauth-refresh] Token is still valid');
    return tokens.accessToken;
  }

  // Token is expired, try to refresh
  console.log('[oauth-refresh] Token expired, attempting refresh...');
  const newTokens = await refreshToken(tokens.refreshToken);

  if (!newTokens) {
    console.log('[oauth-refresh] Refresh failed, manual login required');
    return null;
  }

  // Save the new tokens
  const saved = await writeTokensToKeychain(newTokens);
  if (saved) {
    console.log('[oauth-refresh] New tokens saved to keychain');
    return newTokens.accessToken;
  }

  // Even if save failed, return the new token for this session
  console.log('[oauth-refresh] Warning: Could not save tokens to keychain');
  return newTokens.accessToken;
}

// Check if we have refresh capability (has tokens stored)
async function hasRefreshCapability(): Promise<boolean> {
  const tokens = await readTokensFromKeychain();
  return tokens !== null && !!tokens.refreshToken;
}

export {
  ensureValidToken,
  refreshToken,
  hasRefreshCapability,
  readTokensFromKeychain,
  writeTokensToKeychain,
  isTokenExpired,
};

// Run if executed directly
async function main() {
  console.log('🔄 OAuth Token Refresh\n');
  console.log('Reading tokens from macOS Keychain...\n');

  const tokens = await readTokensFromKeychain();

  if (!tokens) {
    console.log('❌ No tokens found in keychain');
    console.log('Run: claude /login');
    return;
  }

  console.log('Has access token:', !!tokens.accessToken);
  console.log('Has refresh token:', !!tokens.refreshToken);
  console.log('Token expired:', isTokenExpired(tokens));

  if (tokens.expiresAt) {
    const expiresDate = new Date(tokens.expiresAt);
    const now = new Date();
    const minutesUntilExpiry = Math.round((tokens.expiresAt - Date.now()) / 60000);
    console.log('Expires at:', expiresDate.toISOString());
    console.log('Minutes until expiry:', minutesUntilExpiry);
  }

  console.log('\n--- Attempting to ensure valid token ---\n');

  const token = await ensureValidToken();
  if (token) {
    console.log('\n✓ Got valid access token');
    console.log('Token prefix:', token.substring(0, 20) + '...');
  } else {
    console.log('\n✗ Could not get valid token - manual login required');
    console.log('Run: claude /login');
  }
}

// ES module check for direct execution
const isDirectRun = process.argv[1]?.includes('oauth-refresh');
if (isDirectRun) {
  main().catch(console.error);
}
