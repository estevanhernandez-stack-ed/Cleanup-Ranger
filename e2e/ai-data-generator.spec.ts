import { test } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

test.use({ 
  permissions: ['geolocation', 'camera'],
  geolocation: { latitude: 39.7392, longitude: -104.9903 } // Defaulting to Denver
});

test('AI Photo Editor Agent: Seeding Demo Data', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  // Navigate to app
  console.log("Navigating to local app...");
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(4000); // Wait for Places API to load nearby parks

  // Find a park to report on
  console.log("Looking for a nearby park to submit a report for...");
  
  // Wait specifically for park cards to render in the sidebar
  await page.waitForSelector('.park-card', { timeout: 15000 }).catch(() => {
    console.log("Timed out waiting for park cards to load.");
  });

  const parkCards = page.locator('.park-card');
  const count = await parkCards.count();
  
  if (count === 0) {
    console.log("Could not find any parks on the radar. Exiting script.");
    test.skip();
    return;
  }

  console.log(`Found ${count} parks. Selecting the first one...`);
  await parkCards.nth(0).click();
  await page.waitForTimeout(1000);

  // 1. REPORT A HAZARD
  console.log("Opening hazard scanner...");
  await page.getByRole('button', { name: /Report Hazard/i }).first().click();
  await page.waitForTimeout(1000);

  // Instead of camera, we will upload the generated litter photo
  console.log("Uploading litter photo evidence...");
  const litterFilePath = path.join(__dirname, 'fixtures', 'litter_park_1.png');
  
  // Playwright method to upload a file to a hidden input
  await page.locator('input[type="file"]').setInputFiles(litterFilePath);
  await page.waitForTimeout(1000);

  console.log("Running AI Analysis on Hazard...");
  await page.getByRole('button', { name: /Run AI Analysis/i }).first().click();
  
  // Wait for the Gemini analysis to finish (the Confirm button will appear)
  await page.waitForSelector('button:has-text("Confirm & Report Hazard")', { timeout: 15000 });
  
  console.log("Confirming Hazard Report...");
  await page.getByRole('button', { name: /Confirm & Report Hazard/i }).first().click();
  await page.waitForTimeout(2000);

  // 2. VERIFY CLEANUP
  console.log("Opening cleanup scanner...");
  await page.getByRole('button', { name: /Verify Cleanup/i }).first().click();
  await page.waitForTimeout(1000);

  console.log("Uploading cleanup photo evidence...");
  // Use the second image (we'll assume the generated bags photo worked)
  const cleanupFilePath = path.join(__dirname, 'fixtures', 'cleanup_bags_1.png');
  
  await page.locator('input[type="file"]').setInputFiles(cleanupFilePath);
  await page.waitForTimeout(1000);

  console.log("Running Gemini Verification...");
  await page.getByRole('button', { name: /Run Verification/i }).first().click();
  
  // Wait for the Gemini analysis to finish
  await page.waitForSelector('button:has-text("Claim Community Points")', { timeout: 15000 });
  
  console.log("Claiming Points...");
  await page.getByRole('button', { name: /Claim Community Points/i }).first().click();
  
  await page.waitForTimeout(2000);
  console.log("\nData population complete! Check the map and sidebar.");
});
