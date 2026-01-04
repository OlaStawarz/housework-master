import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Śledzenie błędów (Trace Viewer)
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },

  // Konfiguracja serwera lokalnego (Astro)
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Zgodnie z zasadami: Initialize configuration only with Chromium/Desktop Chrome browser
  ],
});

