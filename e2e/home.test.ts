import { test, expect } from '@playwright/test';

test.describe('Home Page and Feature Flags', () => {
  test('should load the landing page with correct content', async ({ page }) => {
    await page.goto('/');
    
    // Verify key landing page elements render
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Launch Map Ops')).toBeVisible();
    
    // Verify feature cards are present
    await expect(page.locator('text=AI Photo Evidence')).toBeVisible();
    await expect(page.locator('text=City Friendly Mapping')).toBeVisible();
    await expect(page.locator('text=Gamified Community Ops')).toBeVisible();
  });

  test('should navigate to map page via CTA', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Launch Map Ops');
    
    // Verify URL changed to /map
    await expect(page).toHaveURL(/\/map/);
    
    // Verify the map container renders (even if Maps API isn't loaded)
    await expect(page.locator('.map-page')).toBeVisible();
  });

  test('should show navbar on all pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    await page.goto('/map');
    await expect(page.locator('nav')).toBeVisible();
  });
});
