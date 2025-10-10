import { test, expect } from '@playwright/test';

test('basic auth example', async ({ browser }) => {
  // Create a new context with httpCredentials for Basic Auth
  const context = await browser.newContext({
    httpCredentials: {
      username: 'myUser',
      password: 'myPassword'
    }
  });
  const page = await context.newPage();

  // Go to the protected page
  await page.goto('https://example.com/protected');

  // Verify page content
  await expect(page).toHaveURL('https://example.com/protected');

  await context.close();
});