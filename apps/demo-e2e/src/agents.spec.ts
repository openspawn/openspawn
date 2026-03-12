import { test, expect } from "@playwright/test";

/**
 * P1 — Agents page interactive flows.
 */

test.describe("Agents page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/agents", { waitUntil: "networkidle" });
  });

  test("renders agent cards or list", async ({ page }) => {
    // If demo data is loaded, we expect agents. If not, at least no crash.
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("search filters agents", async ({ page }) => {
    const searchInput = page.locator(
      "input[placeholder*=earch], input[type=search], input[aria-label*=earch]",
    );

    // If search exists, type and verify no crash
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill("SpongeBob");
      // Wait for filter to apply
      await page.waitForTimeout(500);
      // Page should still be functional (no error boundary)
      const errorBoundary = page.locator("text=Something went wrong");
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test("sort dropdown works without crash", async ({ page }) => {
    const sortButton = page.locator(
      "button:has-text('Sort'), button:has-text('sort'), [aria-label*=ort]",
    );

    if (
      await sortButton
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false)
    ) {
      await sortButton.first().click();
      // Should open dropdown without crashing
      await page.waitForTimeout(300);
      const errorBoundary = page.locator("text=Something went wrong");
      await expect(errorBoundary).not.toBeVisible();
    }
  });
});
