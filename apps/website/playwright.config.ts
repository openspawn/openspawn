import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the OpenSpawn website.
 *
 * Dev server runs on port 4300 (see vite.config.mts).
 *
 * Note: On Linux systems without Playwright's system dependencies, set
 * LD_LIBRARY_PATH before running (the `test:e2e` script handles this
 * automatically when libs are in ~/.playwright-libs). In CI, run:
 *   npx playwright install --with-deps chromium
 */

// Inject LD_LIBRARY_PATH for systems missing the Chromium system deps
// (no-op on systems where deps are already installed).
const extraLibPath = `${process.env.HOME}/.playwright-libs`;
if (process.env.LD_LIBRARY_PATH) {
  process.env.LD_LIBRARY_PATH = `${extraLibPath}:${process.env.LD_LIBRARY_PATH}`;
} else {
  process.env.LD_LIBRARY_PATH = extraLibPath;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:4300",
    trace: "on-first-retry",
    // Headless mode with no-sandbox for containerised environments
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm exec nx serve website",
    url: "http://localhost:4300",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Run from the monorepo root (two levels up from apps/website)
    cwd: "../../",
  },
});
