import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between all views', async ({ page }) => {
    await page.goto('/');

    // Dashboard is default view
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Navigate to Add
    await page.getByTestId('tab-add').click();
    await expect(page.getByRole('heading', { name: 'Add Bottle' })).toBeVisible();

    // Navigate to Search
    await page.getByTestId('tab-search').click();
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

    // Navigate to Settings
    await page.getByTestId('tab-settings').click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByTestId('tab-dashboard').click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should highlight the active tab', async ({ page }) => {
    await page.goto('/');

    const dashboardTab = page.getByTestId('tab-dashboard');
    await expect(dashboardTab).toHaveAttribute('aria-current', 'page');

    await page.getByTestId('tab-add').click();
    const addTab = page.getByTestId('tab-add');
    await expect(addTab).toHaveAttribute('aria-current', 'page');
    await expect(dashboardTab).not.toHaveAttribute('aria-current', 'page');
  });
});
