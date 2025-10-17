import { test, expect } from '@playwright/test';

test('Hover over Electronics and click Laptops submenu on Flipkart', async ({ page }) => {
  // Navigate to Flipkart
  await page.goto('https://www.flipkart.com', { waitUntil: 'domcontentloaded' });

  // Close login popup if visible
  const closePopup = page.locator("//button[text()='✕']");
  if (await closePopup.isVisible()) {
    await closePopup.click();
  }

  // Hover over Electronics menu
  const electronicsMenu = page.locator("//span[text()='Electronics']");
  await electronicsMenu.hover();
  console.log("✅ Hovered over Electronics menu");

  // Wait for submenu to appear and click "Laptops"
  const laptopsSubmenu = page.locator("//a[text()='Laptops']");
  await laptopsSubmenu.waitFor({ state: 'visible' });
  await laptopsSubmenu.click();
  console.log("✅ Clicked Laptops submenu");
});
