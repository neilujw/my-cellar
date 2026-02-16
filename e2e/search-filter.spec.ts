import { test, expect } from '@playwright/test';

/** Adds a bottle via the Add form and waits for dashboard. */
async function addBottle(
  page: import('@playwright/test').Page,
  data: { name: string; vintage: string; type: string; country: string; region: string },
): Promise<void> {
  await page.getByTestId('tab-add').click();
  await expect(page.getByRole('heading', { name: 'Add Bottle' })).toBeVisible();
  await page.getByTestId('input-name').fill(data.name);
  await page.getByTestId('input-vintage').fill(data.vintage);
  await page.getByTestId('input-type').selectOption(data.type);
  await page.getByTestId('input-country').fill(data.country);
  await page.getByTestId('input-region').fill(data.region);
  await page.getByTestId('input-quantity').fill('1');
  await page.getByTestId('submit-button').click();
  // Wait for navigation back to dashboard
  await expect(page.getByTestId('total-count')).toBeVisible();
}

test.describe('Search and Filter', () => {
  test('should search and filter bottles', async ({ page }) => {
    await page.goto('/');

    // Add bottles
    await addBottle(page, {
      name: 'Barolo Riserva',
      vintage: '2016',
      type: 'red',
      country: 'Italy',
      region: 'Piedmont',
    });
    await addBottle(page, {
      name: 'Sancerre Blanc',
      vintage: '2021',
      type: 'white',
      country: 'France',
      region: 'Loire',
    });

    // Navigate to Search view
    await page.getByTestId('tab-search').click();

    // Wait for search input to be visible (bottles need to load)
    await expect(page.getByTestId('search-input')).toBeVisible();

    // Both bottles should be visible initially in search results
    const results = page.getByTestId('search-results');
    await expect(results.getByText('Barolo Riserva')).toBeVisible();
    await expect(results.getByText('Sancerre Blanc')).toBeVisible();

    // Search by name
    await page.getByTestId('search-input').fill('Barolo');
    await expect(results.getByText('Barolo Riserva')).toBeVisible();
    await expect(results.getByText('Sancerre Blanc')).not.toBeVisible();

    // Clear search — both should appear again
    await page.getByTestId('search-input').clear();
    await expect(results.getByText('Barolo Riserva')).toBeVisible();
    await expect(results.getByText('Sancerre Blanc')).toBeVisible();
  });
});
