// e2e/tests/exerciseProxy.spec.js
import { test, expect } from "@playwright/test";

const frontendURL = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";

// Regex to catch both with‑and‑without trailing slash, with any query
const EXERCISES_ROUTE = /\/api\/proxy\/exercises\/?.*/;
const USER_ME_ROUTE = /\/api\/user\/me\/?.*/;

const mockExercises = [
  {
    id: 1,
    exercise_name: "Push Up",
    Category: "Bodyweight",
    Difficulty: "Beginner",
    Force: "Push",
    target: { Primary: ["Chest"] },
  },
  {
    id: 2,
    exercise_name: "Dumbbell Fly",
    Category: "Dumbbells",
    Difficulty: "Intermediate",
    Force: "Pull",
    target: { Primary: ["Chest"] },
  },
  {
    id: 3,
    exercise_name: "Bench Press",
    Category: "Barbell",
    Difficulty: "Beginner",
    Force: "Push",
    target: { Primary: ["Chest"] },
  },
];

test.describe("Exercise Proxy API Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Stub AuthContext’s /api/user/me
    await page.route(USER_ME_ROUTE, (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          username: "testuser",
          email: "testuser@example.com",
          is_staff: false,
          is_superuser: false,
        }),
      })
    );

    // Seed a dummy JWT so AuthContext thinks we’re logged in
    await page.addInitScript(() => {
      const header = "eyJhbGciOiJub25lIn0";
      const payload = "eyJ1c2VyX2lkIjoxLCJleHAiOjk5OTk5OTk5OTl9";
      localStorage.setItem("access", `${header}.${payload}.`);
      localStorage.setItem("refresh", "dummy.refresh.token");
    });
  });

  test("Happy Path: displays only matching exercises", async ({ page }) => {
    await page.route(EXERCISES_ROUTE, (route) => {
      const url = new URL(route.request().url());
      const muscle = url.searchParams.get("muscle");
      const difficulty = url.searchParams.get("difficulty");
      const filtered = mockExercises.filter(
        (ex) =>
          (!muscle || ex.target.Primary.includes(muscle)) &&
          (!difficulty || ex.Difficulty === difficulty)
      );
      return route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(filtered),
      });
    });

    await page.goto(`${frontendURL}/exercises`);
    await expect(page.getByText("Push Up")).toBeVisible();
    await expect(page.getByText("Bench Press")).toBeVisible();
    await expect(page.getByText("Dumbbell Fly")).not.toBeVisible();
  });

  test("Error Handling: shows message when proxy fails", async ({ page }) => {
    await page.route(EXERCISES_ROUTE, (route) =>
      route.fulfill({
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "External API failed" }),
      })
    );

    await page.goto(`${frontendURL}/exercises`);
    await expect(
      page.getByText(/^Error: Failed to fetch exercises from proxy/)
    ).toBeVisible({ timeout: 20000 });
  });

  // at the bottom of e2e/tests/exerciseProxy.spec.js
  test.afterEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });
});
