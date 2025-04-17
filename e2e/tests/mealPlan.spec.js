// e2e/tests/mealPlan.spec.js

import { test, expect } from '@playwright/test';

const backendURL  = process.env.BACKEND_URL?.trim()  || 'http://127.0.0.1:8000';

test.describe.serial('Meal Plan Generation Flow', () => {
  const ts           = Date.now();
  const userEmail    = `mealuser${ts}@example.com`;
  const userPassword = 'Password123!';
  const age          = 30;
  const height       = 170;
  const weight       = 70;
  let accessToken;
  let foodIds        = [];

  test.beforeAll(async ({ request }) => {
    // 1) Register
    const r1 = await request.post(`${backendURL}/api/user/register/`, {
      data: { email: userEmail, password: userPassword }
    });
    expect(r1.ok()).toBeTruthy();

    // 2) Login → tokens
    const r2 = await request.post(`${backendURL}/api/token/`, {
      data: { username: userEmail, password: userPassword }
    });
    expect(r2.ok()).toBeTruthy();
    const tokens = await r2.json();
    accessToken = tokens.access;

    // 3) Create health profile
    const r3 = await request.post(`${backendURL}/api/health-profile/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        age,
        height,
        weight,
        dietary_preference: 'non_vegetarian',
        health_conditions: 'none'
      }
    });
    expect(r3.ok()).toBeTruthy();

    // 4) Fetch recommendations to get some foodIds
    const rec = await request.get(
      `${backendURL}/api/recommendations/?goal=maintain&region=EU`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(rec.ok()).toBeTruthy();
    const recJson = await rec.json();
    const allFoods = Object.values(recJson.recommended_foods).flat();
    foodIds = allFoods.slice(0, 5).map(f => f.food_id);
    expect(foodIds.length).toBeGreaterThan(0);
  });

  test('Happy‑Path Generation', async ({ request }) => {
    const res = await request.post(
      `${backendURL}/api/meal-plan-optimization/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { goal: 'maintain', food_ids: foodIds }
      }
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // daily_targets shape
    expect(body.daily_targets).toHaveProperty('calories');
    expect(body.daily_targets).toHaveProperty('protein');
    expect(body.daily_targets).toHaveProperty('carbs');
    expect(body.daily_targets).toHaveProperty('fat');
    expect(body.daily_targets).toHaveProperty('fiber');

    // meal_plan is an object mapping names → numbers
    expect(typeof body.meal_plan).toBe('object');
    for (const [name, portion] of Object.entries(body.meal_plan)) {
      expect(typeof name).toBe('string');
      expect(typeof portion).toBe('number');
      expect(portion).toBeGreaterThan(0);
    }
  });

  test('Edge Case: Empty Food List (fallback to all foods)', async ({ request }) => {
    const res = await request.post(
      `${backendURL}/api/meal-plan-optimization/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { goal: 'maintain', food_ids: [] }
      }
    );
    expect(res.ok()).toBeTruthy();
    const { daily_targets, meal_plan } = await res.json();

    // daily_targets should still be present
    expect(daily_targets).toHaveProperty('calories');

    // plan falls back to full list → at least one entry
    expect(Object.keys(meal_plan).length).toBeGreaterThan(0);
  });

  test('Edge Case: Invalid Goal', async ({ request }) => {
    const res = await request.post(
      `${backendURL}/api/meal-plan-optimization/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { goal: 'fly-away', food_ids: foodIds }   // invalid goal
      }
    );
    // invalid goal → 400 with error message
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  // ----------------------------------------------------------------
  // Clean up the test user (cascade-deletes meal plan, profile, logs, etc.)
  test.afterAll(async ({ request }) => {
    try {
      // re-login to get a fresh token
      const login2 = await request.post(`${backendURL}/api/token/`, {
        data: { username: userEmail, password: userPassword }
      });
      const { access } = await login2.json();

      // delete the user (cascades)
      const del = await request.delete(`${backendURL}/api/user/me/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      expect(del.ok()).toBeTruthy();
    } catch (e) {
      // swallow any cleanup errors
    }
  });
});
