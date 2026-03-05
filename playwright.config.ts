import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 * Run: `npx playwright test`
 * Run headed: `npx playwright test --headed`
 * UI mode: `npx playwright test --ui`
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in parallel */
  fullyParallel: true,
  /* Fail the build on CI if test.only is left in code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI */
  retries: process.env.CI ? 2 : 0,
  /* Limit workers on CI */
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    /* Base URL for all tests */
    baseURL: 'http://localhost:3000',
    /* Keep trace on first retry */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Viewport */
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    /* Desktop Chrome */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Mobile Safari */
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  /* Start the Next.js dev server before tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
