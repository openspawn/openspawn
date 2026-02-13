import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3333',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
  webServer: {
    command:
      'cd ../../.. && npx nx build dashboard && cd tools/sandbox && SERVE_DASHBOARD=1 DASHBOARD_DIR=../../dist/apps/dashboard node --import tsx src/index.ts',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
