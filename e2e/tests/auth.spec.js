// e2e/tests/auth.spec.js
import { test, expect } from "@playwright/test";

const frontendURL = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";

test.describe("User Registration, Login, and Authenticated Access", () => {
  // Use a unique email address for each test run.
  const timestamp = Date.now();
  const userEmail = `user${timestamp}@example.com`;
  const userPassword = "Password123!";

  test("Complete User Journey", async ({ page }) => {
    // === Registration Flow ===
    await page.goto(`${frontendURL}/register`);
    await expect(
      page.getByRole("heading", { name: "Register for Fitness App" })
    ).toBeVisible();

    // Step 1: Basic Info
    await page.fill('input[placeholder="Enter your email"]', userEmail);
    await page.fill('input[placeholder="Enter your password"]', userPassword);
    await page.click('button:has-text("Next")');

    // Step 2: Personal Details
    await expect(page.locator("text=Personal")).toBeVisible();
    await page.fill('input[placeholder="Enter your age"]', "25");
    await page.fill('input[placeholder="Enter your height in cm"]', "170");
    await page.fill('input[placeholder="Enter your weight in kg"]', "70");
    await page.click('button:has-text("Next")');

    // Step 3: Dietary Preference
    await expect(
      page.getByRole("heading", { name: "Dietary Preference" })
    ).toBeVisible();
    await page.selectOption("select", "non_vegetarian");
    await page.click('button:has-text("Next")');

    // Step 4: Health Conditions
    await expect(
      page.getByRole("heading", { name: "Select Health Conditions" })
    ).toBeVisible();
    await page.check('input[type="checkbox"][value="none"]');
    await page.click('button:has-text("Complete Registration")');

    // Wait for redirection to home page.
    await page.waitForURL(`${frontendURL}/`, { timeout: 30000 });

    // Verify that the protected route is accessible.
    await page.goto(`${frontendURL}/profile`);
    await expect(page.getByText("My Profile")).toBeVisible();
    await expect(page.getByText(userEmail)).toBeVisible();

    // === Logout and Login Flow ===
    await page.goto(`${frontendURL}/logout`);
    await page.waitForLoadState("networkidle");

    // Go to login page.
    await page.goto(`${frontendURL}/login`);
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible({
      timeout: 10000,
    });

    // Login Flow
    await page.fill('input[placeholder="Enter your username"]', userEmail);
    await page.fill('input[placeholder="Enter your password"]', userPassword);
    await page.click('button:has-text("Login")');

    // Wait for redirection after login.
    await page.waitForURL(`${frontendURL}/`, { timeout: 30000 });

    // Check protected profile again.
    await page.goto(`${frontendURL}/profile`);
    await expect(page.getByText("My Profile")).toBeVisible();
    await expect(page.getByText(userEmail)).toBeVisible();
  });

  // Cleanup: delete the test user after each run
  test.afterEach(async ({ page }) => {
    // Grab the current access token from localStorage
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access")
    );
    if (!accessToken) return;

    // Send DELETE /api/user/me/ to remove the account, but don't let cleanup errors fail the test
    try {
      await page.request.delete(`${frontendURL}/api/user/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // ignore any error during cleanup
    }
  });
});
