import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('shows KPI cards', async ({ page }) => {
    await expect(page.getByText(/courses/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/vendors/i).first()).toBeVisible();
    await expect(page.getByText(/enrollments/i).first()).toBeVisible();
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /courses/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /categories/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /vendors/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /enrollments/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /payouts/i })).toBeVisible();
  });

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search|type a command/i)).toBeVisible({ timeout: 3_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/search|type a command/i)).not.toBeVisible();
  });

  test('shortcuts modal opens with Ctrl+/', async ({ page }) => {
    await page.keyboard.press('Control+/');
    await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible({ timeout: 3_000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('navigates to Courses page', async ({ page }) => {
    await page.getByRole('link', { name: /courses/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/courses/);
    await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Categories page', async ({ page }) => {
    await page.getByRole('link', { name: /categories/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/categories/);
    await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Vendors page', async ({ page }) => {
    await page.getByRole('link', { name: /vendors/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/vendors/);
  });

  test('navigates to Audit Log page', async ({ page }) => {
    await page.getByRole('link', { name: /audit/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/audit/);
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({ timeout: 10_000 });
  });
});
