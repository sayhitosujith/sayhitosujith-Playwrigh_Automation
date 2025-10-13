import { test, expect } from '@playwright/test';

// Use environment variables for credentials
const NAUKRI_EMAIL = process.env.NAUKRI_EMAIL || 'sayhitosujith@gmail.com';
const NAUKRI_PASSWORD = process.env.NAUKRI_PASSWORD || 'Qw@12345678';

test('test', async ({ page, context }) => {

  await test.step('Navigate to naukri URL', async () => {
    await page.goto('https://www.naukri.com/nlogin/login?utm_source=google&utm_medium=cpc&utm_campaign=Brand&gad_source=1&gclid=CjwKCAjwo6GyBhBwEiwAzQTmc34DfBd9dNPPn_R_W3UozmHxoGFxQRepNJgOcFPHLMUoYhEwNErtOxoC6a0QAvD_BwE&gclsrc=aw.ds');
  })

  //   await test.step('Network Interception', async () => {
  // page.on('request', req => console.log(req.url()));
  // page.on('response', res => console.log(res.url(), res.status()));  })
// await test.step('measure page performance or speed with Playwright', async () => {
 // })


  await test.step('Enter login credentials', async () => {
  await expect(page.getByRole('strong').filter({ hasText: 'Login' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).click();
  await page.getByRole('textbox', { name: 'Enter Email ID / Username' }).fill((NAUKRI_EMAIL));
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).fill((NAUKRI_PASSWORD));
  await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  })


 await test.step('User navigates to profile', async () => {
  await expect(page.getByRole('link', { name: 'View profile' })).toBeVisible();
  await page.getByRole('link', { name: 'View profile' }).click();
});

 await test.step('Verify Resume headline', async () => {
await expect(page.locator('#lazyResumeHead').getByText('editOneTheme')).toBeVisible();
await page.locator('#lazyResumeHead').getByText('editOneTheme').click();
await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
await page.getByRole('button', { name: 'Save' }).click();

// page.on('dialog', dialog => dialog.accept());  //accepts the alert popup

});

// await test.step('upload resume', async () => {
// await expect(page.getByRole('button', { name: 'Update resume' })).toBeVisible();
// await page.getByRole('button', { name: 'Update resume' }).click();
// await page.waitForTimeout(30000);
// await page.getByRole('button', { name: 'Update resume' }).setInputFiles('D:\\Playwright\\Playwright\\tests\\Files\\Sujith-S.pdf');
// await expect(page.getByText('Resume has been successfully')).toBeVisible();
// });

await test.step('Logout of Naukri', async () => {
await page.getByRole('img', { name: 'naukri user profile img' }).click();
await expect(page.getByText('Logout')).toBeVisible();
await page.getByText('Logout').click();  })
  await context.close();  // closes all pages in the context

});