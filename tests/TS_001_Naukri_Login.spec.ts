import { test, expect } from './fixtures';
import { LoginPage } from '../Pages/Login';
import testData from '../Files/Test-data/userdata.json';

const env = process.env.ENV || 'qa';
const baseUrls: Record<string, string> = {
  qa: 'https://www.naukri.com/nlogin/login',
  dev: 'https://www.naukri.com/nlogin/login',
  prod: 'https://www.naukri.com/nlogin/login'
};
const BASE_URL = process.env.NAUKRI_BASE_URL || baseUrls[env];

test('Naukri login and profile validation @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const { validusername } = testData;

  // Navigate to login page
  await test.step('Navigate to Naukri login page', async () => {
    await page.goto(BASE_URL);
  });

  // Login
  await test.step('Enter login credentials', async () => {
    await loginPage.usernameinput.fill(validusername.email);
    await loginPage.passwordinput.fill(validusername.password);
    await expect(loginPage.loginbutton).toBeVisible();
    await loginPage.loginbutton.click();
    console.log('✅ Logged in with valid credentials');
  });

  // Navigate to profile
  await test.step('Navigate to profile', async () => {
    const profileLink = page.getByRole('link', { name: 'View profile' });
    await expect(profileLink).toBeVisible();
    await profileLink.click();
    console.log('✅ Navigated to profile');
  });

  // Verify Resume headline
  await test.step('Verify Resume headline', async () => {
    const headline = page.locator('#lazyResumeHead').getByText('editOneTheme');
    await expect(headline).toBeVisible();
    await headline.click();
    await page.getByRole('textbox', { name: 'Minimum 5 words. Sample' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    console.log('✅ Resume headline updated');
  });

  // Optional: Upload resume
  const skipUpload = true; // set to false to enable upload
  await test.step('Upload resume', async () => {
    if (skipUpload) {
      console.log('Skipping Upload Resume step');
      return;
    }

    // Correct file upload
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error('File input not found');
    await fileInput.setInputFiles('tests/Files/Sujith_Profile.pdf');

    await expect(page.getByText('Resume has been successfully')).toBeVisible();
    console.log('✅ Resume uploaded successfully');
  });

  // Logout
  await test.step('Logout of Naukri', async () => {
    await page.getByRole('img', { name: 'naukri user profile img' }).click();
    const logoutBtn = page.getByRole('menuitem', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.close();
    console.log('✅ Logged out successfully');
  });
});
