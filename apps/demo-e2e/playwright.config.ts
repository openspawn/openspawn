import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:4200";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./src",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    ...(isCI
      ? []
      : [
          {
            name: "mobile-chrome",
            use: { ...devices["Pixel 5"] },
          },
        ]),
  ],

  webServer: {
    command: isCI ? "pnpm exec nx preview dashboard" : "pnpm exec nx serve dashboard",
    url: baseURL,
    reuseExistingServer: !isCI,
    cwd: "../..",
    timeout: 120_000,
  },
});
