import { test } from './fixtures';
import { expect } from '@playwright/test';
import { LoginPage } from '../Pages/Login';
import testData from '../Files/Test-data/userdata.json';

// Define BASE_URL for Naukri
const BASE_URL = process.env.NAUKRI_BASE_URL || 'https://www.naukri.com/nlogin/login';
const env = process.env.ENV || 'qa';
const baseUrls: { [key: string]: string } = {
  qa: 'https://www.naukri.com/nlogin/login',
  dev: 'https://www.naukri.com/nlogin/login',
  prod: 'https://www.naukri.com/nlogin/login'
};
const BASE_URL_FINAL = baseUrls[env];

test('Naukri login and profile validation @smoke', async ({ page }) => {
const loginPage = new LoginPage(page);
  await test.step('Navigate to Naukri login page', async () => {
    await page.goto(BASE_URL);
  });

  await test.step('Enter login credentials', async () => {
    const { validusername } = testData;
//get data from json
    await loginPage.usernameinput.fill(validusername.email);
    await loginPage.passwordinput.fill(validusername.password);

    await expect(loginPage.loginbutton).toBeVisible();
    await loginPage.loginbutton.click();
    console.log("✅Logged in with valid credentials");

  });

  await test.step('Navigate to profile', async () => {
    await expect(page.getByRole('link', { name: 'View profile' })).toBeVisible();
    await page.getByRole('link', { name: 'View profile' }).click();
    console.log("✅Navigated to profile");

  });

  // Verify Resume headline
  await test.step('Verify Resume headline', async () => {
    await expect(page.locator('#lazyResumeHead').getByText('editOneTheme')).toBeVisible();
    await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
    await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    console.log("✅Resume headline updated");
  });

  
  // Optional: Upload resume
const skipUpload = true; // or process.env.SKIP_UPLOAD === 'true'

await test.step('Upload resume', async () => {
  if (skipUpload) {
    console.log('Skipping Upload Resume step');
    return; // ❗ exits this step early
  }

  await expect(page.getByRole('button', { name: 'Update resume' })).toBeVisible();
  await page.getByRole('button', { name: 'Update resume' })
    .setInputFiles('tests/Files/Sujith_Profile.pdf');
  await expect(page.getByText('Resume has been successfully')).toBeVisible();
  console.log("✅Resume uploaded successfully");

});

  

  await test.step('Logout of Naukri', async () => {
    await page.getByRole('img', { name: 'naukri user profile img' }).click();
    await expect(page.getByText('Logout')).toBeVisible();
    await page.getByText('Logout').click();
      await page.close();
    console.log("✅Logged out successfully");

  });
});     
