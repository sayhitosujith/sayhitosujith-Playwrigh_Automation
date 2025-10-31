import { test, expect } from './fixtures.js';
import { LoginPage } from '../Pages/Login.js';
import fs from 'fs';
import path from 'path';

const testDataPath = path.resolve(process.cwd(), 'Files', 'Test-data', 'userdata.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as { validusername: { email: string; password: string } };

const env = process.env.ENV || 'qa';
const baseUrls: Record<string, string> = {
  qa: 'https://www.naukri.com/nlogin/login',
  dev: 'https://www.naukri.com/nlogin/login',
  prod: 'https://www.naukri.com/nlogin/login'
};
const BASE_URL = process.env.NAUKRI_BASE_URL || baseUrls[env];

test('Naukri login, profile validation and job apply @regression', async ({ page }: { page: import('playwright').Page }) => {
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
  const skipUpload = true; // change to false if you want to upload
  await test.step('Upload resume', async () => {
    if (skipUpload) {
      console.log('Skipping Upload Resume step');
      return;
    }

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error('File input not found');
    await fileInput.setInputFiles(path.resolve(process.cwd(), 'Files', 'Sujith-S.pdf'));

    await expect(page.getByText('Resume has been successfully')).toBeVisible();
    console.log('✅ Resume uploaded successfully');
  });

  // 🔹 Apply for Jobs
  await test.step('Search and Apply for each job', async () => {
    console.log('🔍 Navigating to job search page...');
    await page.goto('https://www.naukri.com/jobs-in-india-?kxjobsearch=true');

    // Example: apply for jobs with keyword "Automation Test Engineer"
    const keyword = 'Automation Test Engineer';
    await page.getByPlaceholder('Enter skills / designations / companies').fill(keyword);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');
    console.log(`✅ Job search results loaded for "${keyword}"`);

    // Loop through job cards (example selector)
    const jobs = await page.$$('a.title.ellipsis');
    console.log(`🔹 Found ${jobs.length} jobs`);

    for (let i = 0; i < Math.min(jobs.length, 5); i++) {  // limit to 5 for safety
      const job = jobs[i];
      const jobTitle = await job.textContent();
      console.log(`➡️ Applying for: ${jobTitle?.trim()}`);

      // Open job in new tab
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        job.click({ button: 'middle' })
      ]);

      await newPage.waitForLoadState('domcontentloaded');

      // Try clicking “Apply” button if available
      const applyButton = await newPage.$('text=Apply');
      if (applyButton) {
        await applyButton.click();
        console.log(`✅ Applied to: ${jobTitle?.trim()}`);
      } else {
        console.log(`⚠️ No apply button found for: ${jobTitle?.trim()}`);
      }

      await newPage.close();
    }
  });

  // Logout
  await test.step('Logout of Naukri', async () => {
    await page.getByRole('img', { name: 'naukri user profile img' }).click();
    await page.getByText('Logout').click();
    await page.close();
    console.log('✅ Logged out successfully');
  });
});
