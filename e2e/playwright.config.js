// e2e/playwright.config.js

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Set the rootDir to the current e2e folder.
  rootDir: __dirname,
  
  // Run only tests in the "tests" folder under e2e.
  testDir: './tests',

  // Ignore non-E2E tests (such as unit/functional tests in the frontend).
  testIgnore: ['../frontend/**', '**/__tests__/**'],

  // Maximum time for a single test.
  timeout: 30000,

  use: {
    // Use an environment variable for the frontend URL or fallback to http://localhost:5173.
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Run in headless mode (set to false for debugging).
    headless: true,

    // Capture screenshot on test failures.
    screenshot: 'only-on-failure',

    // Retain video on test failures.
    video: 'retain-on-failure'
  },

  // Define browser projects for cross-browser testing.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }
  ],

  // Use an HTML reporter to view test reports.
  reporter: [['html', { open: 'never' }]],
  retries: 1,
});
