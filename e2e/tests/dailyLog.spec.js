// e2e/tests/dailyLog.spec.js

import { test, expect } from '@playwright/test';

const frontendURL = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
// Point direct API calls at your Django server:
const backendURL  = process.env.BACKEND_URL?.trim()  || 'http://127.0.0.1:8000';

test.describe.serial('Daily Log and Meal Logging Flow', () => {
  const timestamp    = Date.now();
  const userEmail    = `dailystory${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const height       = 170;
  const weight       = 70;
  let   accessToken, refreshToken, today;

  test.beforeAll(async ({ request }) => {
    // 1) Register a new user
    const register = await request.post(`${backendURL}/api/user/register/`, {
      data: { email: userEmail, password: userPassword }
    });
    expect(register.ok()).toBeTruthy();

    // 2) Log in to get tokens
    const login1 = await request.post(`${backendURL}/api/token/`, {
      data: { username: userEmail, password: userPassword }
    });
    expect(login1.ok()).toBeTruthy();
    ({ access: accessToken, refresh: refreshToken } = await login1.json());

    // 3) Create a Health Profile (needed for BMI)
    const hpRes = await request.post(`${backendURL}/api/health-profile/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        age: 30,
        height,
        weight,
        dietary_preference: 'non_vegetarian',
        health_conditions: 'none'
      }
    });
    expect(hpRes.ok()).toBeTruthy();

    // prepare today's date
    today = new Date().toISOString().split('T')[0];
  });

  test('Log a Meal Entry', async ({ request }) => {
    const res = await request.post(`${backendURL}/api/daily-log/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { date: today, status: 'completed' }
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.message).toBe('Log updated');
    expect(body.log).toMatchObject({ date: today, status: 'completed' });
  });

  test('Daily Log Recap', async ({ request }) => {
    const recap = await request.get(
      `${backendURL}/api/daily-log/${today}/recap/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(recap.ok()).toBeTruthy();
    const data = await recap.json();
    expect(data.date).toBe(today);
    expect(data.status).toBe('completed');

    const expectedBmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
    expect(data.bmi).toBe(expectedBmi);
  });

  test('Error Handling for Invalid Logs', async ({ request }) => {
    // missing date
    const missingDate = await request.post(`${backendURL}/api/daily-log/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'completed' }
    });
    expect(missingDate.status()).toBe(400);

    // invalid status
    const badStatus = await request.post(`${backendURL}/api/daily-log/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { date: today, status: 'invalid-status' }
    });
    expect(badStatus.status()).toBe(400);
  });

  // ----------------------------------------------------------------------
  // Clean up the test user (and cascade-delete all their data)
  test.afterAll(async ({ request }) => {
    try {
      const del = await request.delete(`${backendURL}/api/user/me/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      expect(del.ok()).toBeTruthy();
    } catch (e) {
      // swallow any parse errors or unexpected failures
    }
  });
});
