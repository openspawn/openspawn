import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/legacy",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4200",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "tablet",
      use: { 
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm nx serve api",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "pnpm nx serve dashboard",
      url: "http://localhost:4200",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
