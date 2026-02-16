import { test, expect } from '@playwright/test';

test.describe('Add Bottle', () => {
  test('should add a new bottle and show it on the dashboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to Add view
    await page.getByTestId('tab-add').click();
    await expect(page.getByRole('heading', { name: 'Add Bottle' })).toBeVisible();

    // Fill in required fields
    await page.getByTestId('input-name').fill('Château Margaux');
    await page.getByTestId('input-vintage').fill('2018');
    await page.getByTestId('input-type').selectOption('red');
    await page.getByTestId('input-country').fill('France');
    await page.getByTestId('input-region').fill('Bordeaux');
    await page.getByTestId('input-quantity').fill('2');

    // Submit the form
    await page.getByTestId('submit-button').click();

    // Should navigate back to dashboard and show the bottle in statistics
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('total-count')).toHaveText('2');
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('tab-add').click();

    // Submit without filling any fields
    await page.getByTestId('submit-button').click();

    // Should show validation errors
    await expect(page.getByTestId('error-name')).toBeVisible();
    await expect(page.getByTestId('error-vintage')).toBeVisible();
    await expect(page.getByTestId('error-type')).toBeVisible();
  });
});
