// e2e/tests/stateCleanliness.spec.js
import { test, expect } from "@playwright/test";

const frontendURL = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";
const USER_ME_ROUTE = /\/api\/user\/me\/?.*/;

// Helper to seed a dummy JWT so AuthContext thinks we’re logged in
async function seedTokens(page) {
  await page.addInitScript(() => {
    localStorage.setItem("access", "header.payload.");
    localStorage.setItem("refresh", "dummy.refresh.token");
  });
}

test.describe("State Cleanliness After Actions", () => {
  test.beforeEach(async ({ page }) => {
    // Stub /api/user/me so we start authenticated
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
    await seedTokens(page);
  });

  test("Deleting a saved Meal Plan leaves no ghost in Plans", async ({ page }) => {
    // Stub GET and DELETE on /api/meal-plan or /api/meal-plan/
    let getCount = 0;
    await page.route(/\/api\/meal-plan\/?$/, async (route) => {
      const req = route.request();
      if (req.method() === "GET") {
        getCount++;
        if (getCount === 1) {
          // First GET: simulate existing plan
          return route.fulfill({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 1,
              plan: { "Test Food": 100 },
              daily_targets: { calories: 2000 },
              created_at: "2025-04-17T12:00:00Z",
              user_id: 1,
            }),
          });
        } else {
          // Subsequent GETs: no plan exists
          return route.fulfill({
            status: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ detail: "Not found." }),
          });
        }
      } else if (req.method() === "DELETE") {
        // Simulate successful deletion
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });

    // 1) Go to /plans — stubbed plan should show results
    await page.goto(`${frontendURL}/plans`);
    await expect(page.locator("text=Daily Meal Plan")).toBeVisible();

    // 2) Delete via Settings
    await page.goto(`${frontendURL}/settings`);
    page.on("dialog", (d) => d.accept());
    await page.click("button:has-text('Delete Meal Plan')");

    // 3) Back to /plans — stubbed GET now 404, should see goal-selection
    await page.goto(`${frontendURL}/plans`);
    await expect(page.locator("text=What's Your Goal?")).toBeVisible();
  });

  test("User can delete their Feedback and it disappears", async ({ page }) => {
    let feedbacks = [
      {
        id: 42,
        user: "testuser",
        message: "🍔 ghost feedback",
        created_at: "2025-04-17 10:00 AM",
        parent: null,
        replies: [],
      },
    ];

    await page.route("**/api/feedback/", (route, req) => {
      if (req.method() === "GET") {
        return route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedbacks }),
        });
      }
      return route.continue();
    });

    await page.route("**/api/feedback/42/", (route, req) => {
      if (req.method() === "DELETE") {
        feedbacks = []; // clear our in‑memory list
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });

    // 1) Visit Settings
    await page.goto(`${frontendURL}/settings`);
    // 2) Confirm our test feedback is shown
    await expect(page.locator("text=🍔 ghost feedback")).toBeVisible();

    // 3) Click the Delete button & accept confirm()
    page.on("dialog", (d) => d.accept());
    await page.click(".feedback-item button:has-text('Delete')");

    // 4) After deletion, GET returns empty list and UI updates
    await expect(
      page.locator("text=You haven’t submitted any cases yet.")
    ).toBeVisible();
  });

  // -------------------------------------------------------
  // Tear down: clear our fake tokens so they don't bleed over
  test.afterEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });
});
