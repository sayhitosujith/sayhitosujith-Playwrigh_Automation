// spec: Apply to Jobs on Naukri
// Note: This test is guarded and defaults to dry-run. Set LIVE_APPLY=true to allow final submits.
// Uses existing fixtures and Page objects in the repo.

import { test, expect } from './fixtures.js';
import { LoginPage } from '../Pages/Login.js';
import fs from 'fs';
import path from 'path';

const testDataPath = path.resolve(process.cwd(), 'Files', 'Test-data', 'userdata.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as { validusername: { email: string; password: string } };

// Configuration via environment variables
const KEYWORD = process.env.KEYWORD || 'SDET';
const LOCATION = process.env.LOCATION || 'Bangalore';
const MAX_APPLIES = Number(process.env.MAX_APPLIES || '3');
// default resume path (repo has the PDF in the top-level Files folder)
const RESUME_PATH = process.env.RESUME_PATH || path.resolve(process.cwd(), 'Files', 'Sujith-S.pdf');
const LIVE_APPLY = (process.env.LIVE_APPLY || 'false').toLowerCase() === 'true';

// Base URL (login)
const BASE_URL = process.env.NAUKRI_BASE_URL || 'https://www.naukri.com/nlogin/login';

// Helpers
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function safeGoto(page: import('playwright').Page, url: string, opts: { waitUntil?: 'domcontentloaded' | 'load' | 'networkidle'; timeout?: number } = { waitUntil: 'domcontentloaded', timeout: 30000 }, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: opts.waitUntil || 'domcontentloaded', timeout: opts.timeout ?? 30000 });
      return;
    } catch (err) {
      console.warn(`safeGoto attempt ${attempt + 1} failed for ${url}: ${(err as Error).message}`);
      if (attempt < retries) await sleep(1000 + attempt * 500);
      else throw err;
    }
  }
}

async function dismissOverlays(page: import('playwright').Page) {
  // Common cookie/overlay selectors on large sites — best-effort closes
  const overlaySelectors = [
    'button:has-text("Accept"), button:has-text("I agree"), button:has-text("Got it")',
    'button[aria-label="close"], button[aria-label="Close"], .close, .close-btn, .cookie-banner button',
    'button:has-text("×"), button:has-text("✕")'
  ];
  for (const sel of overlaySelectors) {
    try {
      const loc = page.locator(sel);
      if (await loc.count() > 0) {
        await loc.first().click({ timeout: 2000 }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }
}

test.describe('Apply to Naukri jobs', () => {
  test('Apply to jobs (guarded) - Apply Naukri Live', async ({ page, context }) => {
    // 1. Navigate to Naukri login page
    await test.step('Navigate to Naukri login page', async () => {
      await safeGoto(page, BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await dismissOverlays(page);
      console.log(`Opened ${BASE_URL}`);
    });

    // 2. Login with credentials from Files/Test-data/userdata.json
    await test.step('Login with test credentials', async () => {
      const loginPage = new LoginPage(page);
      const { validusername } = testData;
      await loginPage.usernameinput.fill(validusername.email);
      await loginPage.passwordinput.fill(validusername.password);
      await expect(loginPage.loginbutton).toBeVisible({ timeout: 7000 });
      await loginPage.loginbutton.click();
      // prefer domcontentloaded to avoid long waits caused by background requests
      await page.waitForLoadState('domcontentloaded');
      await dismissOverlays(page);
      console.log('Logged in (attempt).');

      const profile = page.getByRole('link', { name: /Profile|View profile|My Profile/i });
      if (await profile.count() > 0) console.log('Login seemed successful (profile link visible).');
      else console.warn('Profile link not detected after login — test will continue but results may vary.');
    });

    // 3. Search jobs by keyword and location
    await test.step('Search jobs by keyword and location', async () => {
      const keywordInput = page.locator('input[placeholder*="Skill"], input[placeholder*="Search"], input[name*="keyword"], input#qsb-keyword-sugg');
      if (await keywordInput.count() > 0) {
        await keywordInput.first().fill(KEYWORD);
      } else {
        console.log('Keyword input not found — will try direct jobs page search URL fallback.');
      }

      const locInput = page.locator('input[placeholder*="Location"], input[name*="location"], input#qsb-location-sugg');
      if (await locInput.count() > 0) await locInput.first().fill(LOCATION);

      const searchBtn = page.locator('button:has-text("Search"), button:has-text("Find Jobs"), #qsbForm button');
      if (await searchBtn.count() > 0) {
        await searchBtn.first().click();
        await page.waitForLoadState('domcontentloaded');
      } else {
        const fallbackUrl = `https://www.naukri.com/${encodeURIComponent(KEYWORD)}-jobs-in-${encodeURIComponent(LOCATION)}`;
        console.log(`Search button not found — navigating to fallback search url: ${fallbackUrl}`);
        try {
          await safeGoto(page, fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }, 2);
        } catch (navErr) {
          // Sometimes the site aborts navigation (ads/redirects). Try a safer fallback and continue.
          console.warn(`Fallback navigation failed: ${(navErr as Error).message}. Trying site root and continuing.`);
          try {
            await safeGoto(page, 'https://www.naukri.com', { waitUntil: 'domcontentloaded', timeout: 30000 }, 1);
          } catch (rootErr) {
            console.warn(`Navigation to site root also failed: ${(rootErr as Error).message}. Proceeding without search page.`);
          }
        }
      }

      const resultsSelector = 'a.jobTuple__title, a[href*="/job-detail/"], a:has-text("Apply"), .jobCard a';
      try {
        await page.waitForSelector(resultsSelector, { timeout: 10000 });
      } catch (e) {
        console.warn('Timed out waiting for search results selector; proceeding anyway');
      }
      await page.waitForTimeout(1200);
      console.log(`Search performed for keyword="${KEYWORD}" location="${LOCATION}"`);
    });

    // 4. Collect job result links (up to MAX_APPLIES)
    const jobLinks: string[] = [];
    await test.step('Collect job result links', async () => {
      // try several patterns for job cards to maximize coverage
      const cardAnchors = page.locator('a.jobTuple__title, a[href*="/job-detail/"], a:has(.jobTuple__title), .jobTuple, .jobCard a');
      if (await cardAnchors.count() === 0) {
        const anchors = page.locator('a:has-text("Apply"), a[href*="/jobs/"], .jobCard a, [data-job-id] a');
        for (let i = 0; i < Math.min(await anchors.count(), MAX_APPLIES * 3); i++) {
          const href = await anchors.nth(i).getAttribute('href');
          if (href) jobLinks.push(href);
          if (jobLinks.length >= MAX_APPLIES) break;
        }
      } else {
        for (let i = 0; i < Math.min(await cardAnchors.count(), MAX_APPLIES * 3); i++) {
          const href = await cardAnchors.nth(i).getAttribute('href');
          if (href) jobLinks.push(href);
          if (jobLinks.length >= MAX_APPLIES) break;
        }
      }

      const normalized = Array.from(new Set(jobLinks.filter(Boolean).map(h => {
        if (h!.startsWith('http')) return h!;
        return new URL(h!, page.url()).toString();
      }))).slice(0, MAX_APPLIES);

      jobLinks.length = 0;
      normalized.forEach(u => jobLinks.push(u));
      console.log(`Collected ${jobLinks.length} job links (max ${MAX_APPLIES})`);
      // brief human-like pause before processing
      await sleep(600 + Math.floor(Math.random() * 600));
      if (jobLinks.length === 0) console.warn('No job links collected — search selectors may need tuning.');
    });

    // 5. Iterate job links and attempt apply
    const results: Array<{ url: string; status: 'applied' | 'skipped' | 'error' | 'dry-run'; note?: string }> = [];
    for (let i = 0; i < jobLinks.length; i++) {
      const jobUrl = jobLinks[i];
      await test.step(`Process job ${i + 1} / ${jobLinks.length}: ${jobUrl}`, async () => {
        let pageForJob = page;
        let ownContext = false;
        try {
          const newPage = await context.newPage();
          ownContext = true;
          pageForJob = newPage;
          await pageForJob.goto(jobUrl, { waitUntil: 'domcontentloaded' });
          await pageForJob.waitForLoadState('domcontentloaded');
        } catch (err) {
          console.warn(`Could not open new page for ${jobUrl} — reusing main page. Error: ${(err as Error).message}`);
          await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
          pageForJob = page;
          await pageForJob.waitForLoadState('domcontentloaded');
        }

        try {
          const applyBtn = pageForJob.locator('button:has-text("Apply"), a:has-text("Apply"), button:has-text("Quick Apply"), a:has-text("Apply Now")');
          if (await applyBtn.count() === 0) {
            console.log('No Apply button found on job page — skipping apply for this job.');
            results.push({ url: jobUrl, status: 'skipped', note: 'no apply button' });
            if (ownContext) await pageForJob.close();
            return;
          }

          await applyBtn.first().click();
          // wait briefly for apply modal or content to appear
          try {
            await pageForJob.waitForSelector('input[type="file"], form, button:has-text("Submit"), button:has-text("Apply")', { timeout: 4000 });
          } catch {
            await pageForJob.waitForTimeout(900);
          }

          const nameInput = pageForJob.locator('input[name*=name], input[placeholder*="Name"], input[aria-label*="Name"]');
          if (await nameInput.count() > 0) await nameInput.first().fill(testData.validusername.email.split('@')[0]);

          const emailInput = pageForJob.locator('input[type="email"], input[name*=email], input[placeholder*="Email"]');
          if (await emailInput.count() > 0) await emailInput.first().fill(testData.validusername.email);

          const phoneInput = pageForJob.locator('input[name*=phone], input[placeholder*="Mobile"], input[type="tel"]');
          if (await phoneInput.count() > 0) {
            const current = await phoneInput.first().inputValue().catch(() => '');
            if (!current) await phoneInput.first().fill((process.env.PHONE || '').toString());
          }

          const fileInput = await pageForJob.$('input[type="file"]');
          if (fileInput && fs.existsSync(RESUME_PATH)) {
            try {
              await fileInput.setInputFiles(RESUME_PATH);
              console.log(`Uploaded resume from ${RESUME_PATH}`);
            } catch (e) {
              console.warn(`Resume upload failed: ${(e as Error).message}`);
            }
          } else if (fileInput && !fs.existsSync(RESUME_PATH)) {
            console.warn(`Resume input found but resume file not at ${RESUME_PATH}; skipping upload.`);
          } else {
            console.log('No resume file input found on this apply form.');
          }

          if (LIVE_APPLY) {
            const submitBtn = pageForJob.locator('button:has-text("Submit"), button:has-text("Apply"), input[type="submit"]');
            if (await submitBtn.count() > 0) {
              await submitBtn.first().click();
              await pageForJob.waitForLoadState('domcontentloaded');
              const conf = pageForJob.getByText(/application submitted|applied successfully|Application received/i);
              if (await conf.count() > 0) {
                results.push({ url: jobUrl, status: 'applied', note: 'confirmed' });
                console.log(`Applied (LIVE) to ${jobUrl}`);
              } else {
                results.push({ url: jobUrl, status: 'applied', note: 'submitted (no confirmation found)' });
                console.log(`Submitted apply (LIVE) to ${jobUrl}, no confirmation text found.`);
              }
            } else {
              results.push({ url: jobUrl, status: 'error', note: 'no submit button' });
              console.warn('Could not find final submit button — marked as error.');
            }
          } else {
            results.push({ url: jobUrl, status: 'dry-run', note: 'would-submit' });
            console.log(`Dry-run: would submit application for ${jobUrl} (LIVE_APPLY=false)`);
          }
        } catch (err) {
          results.push({ url: jobUrl, status: 'error', note: (err as Error).message });
          console.error(`Error while processing ${jobUrl}: ${(err as Error).message}`);
        } finally {
          if (ownContext && !pageForJob.isClosed()) {
            try { await pageForJob.close(); } catch { /* ignore */ }
          }
        }
        // human-like wait between jobs
        await sleep(800 + Math.floor(Math.random() * 800));
      });
    }

    // 6. Logout / finalize
    await test.step('Logout and finish', async () => {
      const profileImg = page.getByRole('img', { name: /profile|user|avatar/i });
      if (await profileImg.count() > 0) {
        await profileImg.first().click();
        const logout = page.getByRole('link', { name: /Logout/i });
        if (await logout.count() > 0) {
          await logout.first().click();
          console.log('Logged out (best-effort).');
        }
      }

      console.log('Apply run summary:');
      results.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.url} -> ${r.status}${r.note ? ' (' + r.note + ')' : ''}`);
      });

      // persist results to disk for audit
      try {
        const out = path.resolve(process.cwd(), 'test-results', `naukri-apply-results-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
        console.log('Saved apply results to', out);
      } catch (e) {
        console.warn('Failed to save apply results:', (e as Error).message);
      }
    });
  });
});
