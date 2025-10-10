import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ---------------------------
// Setup screenshots folder
// ---------------------------
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

// ---------------------------
// Helper function: Assert Request Payload
// ---------------------------
async function assertRequestPayload(page, urlSubstring, expectedData) {
  const request = await page.waitForRequest(req => req.url().includes(urlSubstring));
  const postData = JSON.parse(request.postData() || '{}');

  for (const key in expectedData) {
    expect(postData[key]).toBe(expectedData[key]);
  }
}

// ---------------------------
// AfterEach hook: Screenshots on Failure
// ---------------------------
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const fileName = `${testInfo.title.replace(/\s/g, '_')}.png`;
    const screenshotPath = path.join(screenshotDir, fileName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
});

// ---------------------------
// Main Test
// ---------------------------
test('Naukri Login, Profile & Resume Test', async ({ page, context }) => {

  // Step 1: Navigate to Login Page
  await test.step('Navigate to Naukri login', async () => {
    await page.goto('https://www.naukri.com/nlogin/login?...');
  });

  // Step 2: Enter Login Credentials & Assert Request Payload
  await test.step('Enter login credentials', async () => {
    await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).fill('sayhitosujith@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Password' }).fill('Qw@12345678');

    // Assert API payload
    await assertRequestPayload(page, '/api/login', { username: 'sayhitosujith@gmail.com' });

    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Login', exact: true }).click();
  });

  // Step 3: Navigate to Profile
  await test.step('Navigate to profile', async () => {
    await expect(page.getByRole('link', { name: 'View profile' })).toBeVisible();
    await page.getByRole('link', { name: 'View profile' }).click();
  });

  // Step 4: Verify Resume Headline
  await test.step('Verify Resume headline', async () => {
    await expect(page.locator('#lazyResumeHead').getByText('editOneTheme')).toBeVisible();
    await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
    await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
  });

  // Step 5: (Optional) Upload Resume
  // Uncomment and adjust file path if needed
  /*
  await test.step('Upload resume', async () => {
    const resumePath = path.resolve(__dirname, 'Files/Sujith-S.pdf');
    await expect(page.getByRole('button', { name: 'Update resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Update resume' }).setInputFiles(resumePath);
    await expect(page.getByText('Resume has been successfully')).toBeVisible();
  });
  */

  // Step 6: Logout
  await test.step('Logout of Naukri', async () => {
    await page.getByRole('img', { name: 'naukri user profile img' }).click();
    await expect(page.getByText('Logout')).toBeVisible();
    await page.getByText('Logout').click();
  });

  // Close browser context
  await context.close();
});
