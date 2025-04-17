// e2e/tests/healthProfile.spec.js

import { test, expect } from '@playwright/test';

const frontendURL = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
// For direct API calls
const backendURL  = process.env.BACKEND_URL?.trim()  || 'http://127.0.0.1:8000';

test.describe.serial('Health Profile Lifecycle', () => {
  const timestamp = Date.now();
  const userEmail = `healthuser${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const initialAge = '25';
  const initialHeight = '170';
  const initialWeight = '70';
  const initialDiet = 'non_vegetarian';

  test('Create and Retrieve Profile', async ({ page }) => {
    // --- Registration Flow (also creates health profile) ---
    await page.goto(`${frontendURL}/register`);
    await expect(
      page.getByRole('heading', { name: 'Register for Fitness App' })
    ).toBeVisible();

    // Step 1: Basic Info
    await page.fill('input[placeholder="Enter your email"]', userEmail);
    await page.fill('input[placeholder="Enter your password"]', userPassword);
    await page.click('button:has-text("Next")');

    // Step 2: Personal Details
    await expect(page.locator('text=Personal')).toBeVisible();
    await page.fill('input[placeholder="Enter your age"]', initialAge);
    await page.fill('input[placeholder="Enter your height in cm"]', initialHeight);
    await page.fill('input[placeholder="Enter your weight in kg"]', initialWeight);
    await page.click('button:has-text("Next")');

    // Step 3: Dietary Preference
    await expect(
      page.getByRole('heading', { name: 'Dietary Preference' })
    ).toBeVisible();
    await page.selectOption('select', initialDiet);
    await page.click('button:has-text("Next")');

    // Step 4: Health Conditions
    await expect(
      page.getByRole('heading', { name: 'Select Health Conditions' })
    ).toBeVisible();
    await page.check('input[type="checkbox"][value="none"]');
    await page.click('button:has-text("Complete Registration")');

    // Should end up on /home
    await page.waitForURL(`${frontendURL}/home`, { timeout: 30000 });

    // --- Verify Profile Page ---
    await page.goto(`${frontendURL}/profile`);
    await expect(
      page.getByRole('heading', { name: 'My Profile' })
    ).toBeVisible();
    await expect(page.getByText(userEmail)).toBeVisible();

    // Check Age
    await expect(
      page.locator('span', { hasText: 'Age:' })
        .locator('xpath=..')
        .getByText(initialAge)
    ).toBeVisible();

    // Check Height
    await expect(
      page.locator('span', { hasText: 'Height:' })
        .locator('xpath=..')
        .getByText(`${initialHeight} cm`)
    ).toBeVisible();

    // Check Weight
    await expect(
      page.locator('span', { hasText: 'Weight:' })
        .locator('xpath=..')
        .getByText(`${initialWeight} kg`)
    ).toBeVisible();

    // Check Dietary Preference
    await expect(
      page.locator('span', { hasText: 'Dietary Preference:' })
        .locator('xpath=..')
        .getByText(initialDiet)
    ).toBeVisible();
  });

  test('Update Profile', async ({ page }) => {
    // --- Login ---
    await page.goto(`${frontendURL}/login`);
    await expect(
      page.getByRole('heading', { name: /login/i })
    ).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Enter your username"]', userEmail);
    await page.fill('input[placeholder="Enter your password"]', userPassword);
    await page.click('button:has-text("Login")');
    // now → splash → home
    await page.waitForURL(`${frontendURL}/home`, { timeout: 30000 });

    // --- Edit Profile ---
    await page.goto(`${frontendURL}/edit-profile`);
    await expect(
      page.getByRole('heading', { name: /edit profile/i })
    ).toBeVisible();

    // Change dietary preference
    await page.selectOption('select', 'vegetarian');
    await page.click('button:has-text("Save Changes")');

    // Back to profile
    await page.waitForURL(`${frontendURL}/profile`, { timeout: 30000 });
    await expect(
      page.locator('span', { hasText: 'Dietary Preference:' })
        .locator('xpath=..')
        .getByText('vegetarian')
    ).toBeVisible();
  });

  test('Input Validation on Profile Update', async ({ page }) => {
    // --- Login again (fresh) ---
    await page.goto(`${frontendURL}/login`);
    await expect(
      page.getByRole('heading', { name: /login/i })
    ).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Enter your username"]', userEmail);
    await page.fill('input[placeholder="Enter your password"]', userPassword);
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${frontendURL}/home`, { timeout: 30000 });

    // Go to edit
    await page.goto(`${frontendURL}/edit-profile`);
    await expect(
      page.getByRole('heading', { name: /edit profile/i })
    ).toBeVisible();

    // Force‐select empty dietary preference
    await page.selectOption('select', '');

    // Attempt to save changes
    await page.click('button:has-text("Save Changes")');

    // Should remain on edit page
    await expect(page).toHaveURL(`${frontendURL}/edit-profile`);

    // The <select> should now be invalid
    const validationMsg = await page.$eval(
      'select[required]',
      el => el.validationMessage
    );
    expect(validationMsg).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // Clean up the test user and all related data
  test.afterAll(async ({ request }) => {
    try {
      // 1) Obtain fresh access token via login
      const tokenRes = await request.post(`${backendURL}/api/token/`, {
        data: { username: userEmail, password: userPassword }
      });
      const { access } = await tokenRes.json();

      // 2) Delete the user (cascade‐deletes HealthProfile, etc.)
      const del = await request.delete(`${backendURL}/api/user/me/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      expect(del.ok()).toBeTruthy();
    } catch (e) {
      // swallow any parse errors or unexpected failures
    }
  });
});
