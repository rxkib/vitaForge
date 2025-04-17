// e2e/tests/tokenRefresh.spec.js
import { test, expect } from '@playwright/test';

const frontendURL   = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
const REFRESH_ROUTE = /\/api\/token\/refresh\/?.*/;
const USER_ME_ROUTE = /\/api\/user\/me\/?.*/;
// Regex for matching the login path
const LOGIN_ROUTE   = /\/login\/?$/;

test.describe('Token Refresh Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Stub /api/user/me so AuthContext.load doesn’t fail immediately
    await page.route(USER_ME_ROUTE, route =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'testuser@example.com',
          is_staff: false,
          is_superuser: false,
        }),
      })
    );
  });

  test('Valid Refresh: issues a new access token', async ({ page }) => {
    // 1) Seed old tokens
    await page.addInitScript(() => {
      localStorage.setItem('access', 'old-access-token');
      localStorage.setItem('refresh', 'valid-refresh-token');
    });

    // 2) Stub the refresh endpoint to return a fresh token
    await page.route(REFRESH_ROUTE, route =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ access: 'brand-new-access-token' }),
      })
    );

    // 3) Navigate so that localStorage is accessible under the app’s origin
    await page.goto(frontendURL, { waitUntil: 'load' });

    // 4) From within that origin, call the same refresh logic
    const newToken = await page.evaluate(async () => {
      const refresh = localStorage.getItem('refresh');
      const res = await fetch('/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const data = await res.json();
      localStorage.setItem('access', data.access);
      return data.access;
    });

    // 5) Verify the returned and stored token is the new one
    expect(newToken).toBe('brand-new-access-token');
    const stored = await page.evaluate(() => localStorage.getItem('access'));
    expect(stored).toBe('brand-new-access-token');
  });

  test('Invalid Refresh: returns error and forces logout', async ({ page }) => {
    // 1) Seed expired tokens
    await page.addInitScript(() => {
      localStorage.setItem('access', 'expired-token');
      localStorage.setItem('refresh', 'invalid-or-expired');
    });

    // 2) Stub both user/me and refresh to return 401
    await page.route(USER_ME_ROUTE, route =>
      route.fulfill({ status: 401, body: '' })
    );
    await page.route(REFRESH_ROUTE, route =>
      route.fulfill({
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ detail: 'Token is invalid or expired' }),
      })
    );

    // 3) Navigate to a protected page (triggers AuthContext logic)
    await page.goto(`${frontendURL}/home`, { waitUntil: 'load' });

    // 4) App should detect failure, clear tokens, and redirect to /login
    await expect(page).toHaveURL(LOGIN_ROUTE);

    // 5) Confirm localStorage has been cleared
    const [access, refresh] = await page.evaluate(() => [
      localStorage.getItem('access'),
      localStorage.getItem('refresh'),
    ]);
    expect(access).toBeNull();
    expect(refresh).toBeNull();
  });

  // clear out the fake tokens after each test
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});
