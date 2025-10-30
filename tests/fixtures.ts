import { test as base } from '@playwright/test';
import type { Page } from 'playwright';
import path from 'path';
import { LoginPage } from '../Pages/Login.js';

// Extend the base test with custom fixtures
export const test = base.extend<{
  page: Page; // override default page if needed
  loginPage: LoginPage;
  uploadFile: (selector: string, filePath: string) => Promise<void>;
}>({
  // Page is provided by default, no need to override unless customization is needed

  // Custom LoginPage fixture
  loginPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await use(login); // inject into test
  },

  // Custom file upload helper
  uploadFile: async ({ page }, use) => {
    await use(async (selector: string, filePath: string) => {
      const absPath = path.resolve(filePath);
      const input = await page.$(selector);
      if (!input) throw new Error(`File input ${selector} not found`);
      await input.setInputFiles(absPath);
    });
  },
});

export { expect } from '@playwright/test';
