/**
 * Shared test helpers — credentials, selectors, login action.
 *
 * Set env vars for real credentials:
 *   ADMIN_USER=your_username  ADMIN_PASS=your_password
 *
 * Defaults fall back to placeholder values that will fail real auth —
 * update before running against a live server.
 */

export const TEST_USER = process.env.ADMIN_USER ?? 'admin';
export const TEST_PASS = process.env.ADMIN_PASS ?? 'admin1234';

export const BASE_URL = 'http://localhost:3000';

/** Log in via the admin login form and wait for navigation to dashboard */
import type { Page } from '@playwright/test';

export async function loginAs(page: Page, username = TEST_USER, password = TEST_PASS) {
  await page.goto('/admin/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/admin$/, { timeout: 15_000 });
}
