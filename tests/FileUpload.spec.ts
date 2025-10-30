import { test } from './fixtures.js';
import { LoginPage } from '../Pages/Login.js';
import fs from 'fs';
import path from 'path';

const testDataPath = path.resolve(process.cwd(), 'Files', 'Test-data', 'userdata.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as { validusername: { email: string; password: string } };

const BASE_URL = process.env.NAUKRI_BASE_URL || 'https://www.naukri.com/nlogin/login';

test('debug: capture profile page screenshot and html', async ({ page }) => {
  const outDir = path.resolve(process.cwd(), 'test-results', 'debug-profile');
  fs.mkdirSync(outDir, { recursive: true });

  // 1) Open login page
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 2) Login using LoginPage (best-effort)
  try {
    const loginPage = new LoginPage(page);
    const { validusername } = testData;
    await loginPage.usernameinput.fill(validusername.email);
    await loginPage.passwordinput.fill(validusername.password);
    await loginPage.loginbutton.click();
    // wait for some page content after login
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);
  } catch (err) {
    console.warn('Login via LoginPage failed; proceeding to capture current page. Error:', (err as Error).message);
  }

  // 3) Try navigate to profile (best-effort)
  const profileLink = page.getByRole('link', { name: /View profile|Profile|My Profile/i });
  if (await profileLink.count() > 0) {
    await profileLink.first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  } else {
    // fallback: try common profile anchor selectors
    const alt = page.locator('a:has-text("Profile"), a:has-text("View Profile"), a[href*="profile"]');
    if (await alt.count() > 0) {
      await alt.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    } else {
      console.warn('Profile link not found; capturing current page instead.');
    }
  }

  // 4) Save screenshot and HTML
  const ts = Date.now();
  const screenshotPath = path.join(outDir, `profile-${ts}.png`);
  const htmlPath = path.join(outDir, `profile-${ts}.html`);
  const urlPath = path.join(outDir, `profile-${ts}.url.txt`);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const html = await page.content();
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(urlPath, page.url(), 'utf8');

  console.log('Debug artifacts saved:');
  console.log('  -', screenshotPath);
  console.log('  -', htmlPath);
  console.log('  -', urlPath);
});
