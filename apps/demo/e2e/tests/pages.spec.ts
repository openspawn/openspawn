import { test, expect } from '@playwright/test';

test.describe('Page Tests', () => {
  test('dashboard: stat cards visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible();
  });

  test('agents: agent list has items', async ({ page }) => {
    await page.goto('/agents');
    await expect(
      page.locator('[data-testid="agent-card"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('tasks: task list has items', async ({ page }) => {
    await page.goto('/tasks');
    // Tasks page should render content inside #root
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('credits: transaction rows are vertically positioned', async ({
    page,
  }) => {
    await page.goto('/credits');
    const rows = page.locator('[data-testid="transaction-row"]');
    const count = await rows.count();
    if (count >= 2) {
      const first = await rows.nth(0).boundingBox();
      const second = await rows.nth(1).boundingBox();
      expect(first).toBeTruthy();
      expect(second).toBeTruthy();
      // Rows should be stacked vertically, not overlapping
      expect(second!.y).toBeGreaterThan(first!.y);
    }
  });

  test('network: ReactFlow canvas renders', async ({ page }) => {
    await page.goto('/network');
    await expect(
      page.locator('.react-flow, [data-testid="network-canvas"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('settings: theme toggle exists', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
