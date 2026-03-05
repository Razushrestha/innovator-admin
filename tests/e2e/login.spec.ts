import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveTitle(/innovator/i);
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpass');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Should stay on the login page and show an error toast / message
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 8_000 });
  });

  test('redirects authenticated user away from login', async ({ page }) => {
    await loginAs(page);
    await page.goto('/admin/login');
    // Should bounce back to dashboard
    await expect(page).toHaveURL(/\/admin$/);
  });
});
