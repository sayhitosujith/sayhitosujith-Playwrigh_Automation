import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  retries: 1, // retry failed tests once
  reporter: [['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    baseURL: process.env.BASE_URL || 'https://example.com',
  },
  projects: [
    // Default to the installed Google Chrome only
    { name: 'Chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  
});
