import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Categories CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
  });

  test('shows categories table', async ({ page }) => {
    // Table or empty state should be present
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no categories/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('search box filters results', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeVisible({ timeout: 5_000 });
    await search.fill('zzz_nonexistent_zzz');
    await page.waitForTimeout(400); // debounce
    const empty = page.getByText(/no categories|no results/i);
    await expect(empty).toBeVisible({ timeout: 5_000 });
  });

  test('opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /new category|add category/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('dashboard renders without horizontal overflow on mobile', async ({ page }) => {
    await loginAs(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2); // 2px tolerance
  });

  test('hamburger menu opens sidebar on mobile', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('button', { name: /menu|open sidebar/i }).click();
    await expect(page.getByRole('navigation')).toBeInViewport({ timeout: 3_000 });
  });
});
