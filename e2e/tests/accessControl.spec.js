// e2e/tests/accessControl.spec.js
import { test, expect } from "@playwright/test";

const frontendURL = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";
const USER_ME_ROUTE = /\/api\/user\/me\/?.*/;

// Helper to seed a dummy JWT
async function seedTokens(
  page,
  { access = "header.payload.", refresh = "dummy.refresh.token" } = {}
) {
  await page.addInitScript(
    ({ a, r }) => {
      localStorage.setItem("access", a);
      localStorage.setItem("refresh", r);
    },
    { a: access, r: refresh }
  );
}

test.describe("Access Control and Role Enforcement", () => {
  test.beforeEach(async ({ page }) => {
    // Stub out user/me so AuthContext thinks we're logged in
    await page.route(USER_ME_ROUTE, (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          email: "test@example.com",
          is_staff: false,
          is_superuser: false,
        }),
      })
    );
  });

  test("Non‑admin cannot access /admin-dashboard", async ({ page }) => {
    // Seed a valid-looking JWT
    await seedTokens(page);
    await page.goto(`${frontendURL}/admin-dashboard`);
    await expect(page.locator("text=Page Not Found")).toBeVisible();
  });

  test("Unauthenticated users are redirected from /admin-dashboard to /login", async ({
    page,
  }) => {
    // No tokens
    await page.goto(`${frontendURL}/admin-dashboard`);
    await expect(page).toHaveURL(/\/login$/);
  });
});
