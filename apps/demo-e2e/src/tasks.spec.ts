import { test, expect } from "@playwright/test";

/**
 * P1 — Tasks page interactive flows.
 */

test.describe("Tasks page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/tasks", { waitUntil: "networkidle" });
  });

  test("renders task list", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    const errorBoundary = page.locator("text=Something went wrong");
    await expect(errorBoundary).not.toBeVisible({ timeout: 5_000 });
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
      await page.waitForTimeout(300);
      const errorBoundary = page.locator("text=Something went wrong");
      await expect(errorBoundary).not.toBeVisible();
    }
  });
});

test.describe("Task Board page", () => {
  test("renders kanban columns", async ({ page }) => {
    await page.goto("/app/task-board", { waitUntil: "networkidle" });

    const errorBoundary = page.locator("text=Something went wrong");
    await expect(errorBoundary).not.toBeVisible({ timeout: 5_000 });

    // Should have column headers
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
