import { test, expect } from '@playwright/test';
import { LoginPage } from '../Pages/Login';

// Use environment variables for credentials
const NAUKRI_EMAIL = process.env.NAUKRI_EMAIL || 'sayhitosujith@gmail.com';
const NAUKRI_PASSWORD = process.env.NAUKRI_PASSWORD || 'Qw@12345678';

// Define BASE_URL for Naukri
const BASE_URL = process.env.NAUKRI_BASE_URL || 'https://www.naukri.com/nlogin/login';

test('@smoke Naukri login and profile validation', async ({ page }) => {
const loginPage = new LoginPage(page);
  await test.step('Navigate to Naukri login page', async () => {
    await page.goto(BASE_URL);
  });

  await test.step('Enter login credentials', async () => {
    await loginPage.usernameinput.fill(NAUKRI_EMAIL);
    await loginPage.passwordinput.fill(NAUKRI_PASSWORD);
    await expect(loginPage.loginbutton).toBeVisible();
    await loginPage.loginbutton.click();
  });

  await test.step('Navigate to profile', async () => {
    await expect(page.getByRole('link', { name: 'View profile' })).toBeVisible();
    await page.getByRole('link', { name: 'View profile' }).click();
  });

  await test.step('Verify Resume headline', async () => {
    await expect(page.locator('#lazyResumeHead').getByText('editOneTheme')).toBeVisible();
    await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
    await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
  });

  // Optional: Upload resume
  /*
  await test.step('Upload resume', async () => {
    await expect(page.getByRole('button', { name: 'Update resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Update resume' }).setInputFiles('D:\\Playwright\\Playwright\\tests\\Files\\Sujith-S.pdf');
    await expect(page.getByText('Resume has been successfully')).toBeVisible();
  });
  */

  await test.step('Logout of Naukri', async () => {
    await page.getByRole('img', { name: 'naukri user profile img' }).click();
    await expect(page.getByText('Logout')).toBeVisible();
    await page.getByText('Logout').click();
  });
});     
