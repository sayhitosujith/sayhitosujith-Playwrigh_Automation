import { test, expect } from '@playwright/test';

test.describe('Naukri Profile Flow', () => {

  test('Login, edit resume headline, and logout', async ({ page, context }) => {

    await test.step('Navigate to naukri URL', async () => {
      await page.goto('https://www.naukri.com/nlogin/login?utm_source=google&utm_medium=cpc&utm_campaign=Brand&gad_source=1&gclid=CjwKCAjwo6GyBhBwEiwAzQTmc34DfBd9dNPPn_R_W3UozmHxoGFxQRepNJgOcFPHLMUoYhEwNErtOxoC6a0QAvD_BwE&gclsrc=aw.ds');
    });

    await test.step('Enter login credentials', async () => {
      await expect(page.locator('strong', { hasText: 'Login' })).toBeVisible();
      await page.getByLabel('Enter Email ID / Username').fill('sayhitosujith@gmail.com');
      await page.getByRole('textbox', { name: 'Enter Password' }).fill('Qw@12345678');
      await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Login', exact: true }).click();
    });

    await test.step('User navigates to profile', async () => {
      await expect(page.getByRole('link', { name: 'View profile' })).toBeVisible();
      await page.getByRole('link', { name: 'View profile' }).click();
    });

    await test.step('Verify Resume headline', async () => {
      await expect(page.locator('#lazyResumeHead').getByText('editOneTheme')).toBeVisible();
      await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
      await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
      // Accept alert popup if appears
      page.once('dialog', async dialog => await dialog.accept());
      await page.getByRole('button', { name: 'Save' }).click();
    });

    // await test.step('Upload resume', async () => {
    //   await expect(page.getByRole('button', { name: 'Update resume' })).toBeVisible();
    //   await page.getByRole('button', { name: 'Update resume' }).click();
    //   await page.waitForTimeout(3000);
    //   await page.getByRole('button', { name: 'Update resume' }).setInputFiles('D:\\Playwright\\Playwright\\tests\\Files\\Sujith-S.pdf');
    //   await expect(page.getByText('Resume has been successfully')).toBeVisible();
    // });

    await test.step('Logout of Naukri', async () => {
      await page.getByRole('img', { name: 'naukri user profile img' }).click();
      await expect(page.getByText('Logout')).toBeVisible();
      await page.getByText('Logout').click();
    });

    await context.close();
  });

  test('Check forgot password flow', async ({ page }) => {
    await page.goto('https://www.naukri.com/nlogin/login');
    await expect(page.getByText('Forgot Password?')).toBeVisible();
    await page.getByText('Forgot Password?').click();
    await expect(page.getByRole('textbox', { name: 'Enter Email ID' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Enter Email ID' }).fill('sayhitosujith@gmail.com');
    await page.getByRole('button', { name: 'GO' }).click();
    await expect(page.getByText('An OTP has been sent to sayhitosujith@gmail.com')).toBeVisible();
  });

  test('Check invalid login shows error', async ({ page }) => {
    await page.goto('https://www.naukri.com/nlogin/login');
    await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).fill('invalid@email.com');
    await page.getByRole('textbox', { name: 'Enter Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByText('Invalid details. Please check the Email ID - Password combination.')).toBeVisible();
  });

});