import { test, expect } from '@playwright/test';

test.describe('P0 Smoke Tests', () => {
  test('app loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const real = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(real).toHaveLength(0);
  });

  test('all nav pages load without white screen', async ({ page }) => {
    const routes = [
      '/',
      '/tasks',
      '/agents',
      '/credits',
      '/events',
      '/network',
      '/messages',
      '/settings',
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });

  test('no localhost URLs in production requests', async ({ page }) => {
    const localhostRequests: string[] = [];
    page.on('request', (req) => {
      if (
        req.url().includes('localhost') &&
        !req.url().includes('localhost:3333')
      ) {
        localhostRequests.push(req.url());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(5000);
    expect(localhostRequests).toHaveLength(0);
  });

  test('login/auth routes are not accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).not.toHaveURL(/login/);
  });

  test('favicon is pineapple emoji', async ({ page }) => {
    await page.goto('/');
    const favicon = page.locator('link[rel="icon"]');
    const href = await favicon.getAttribute('href');
    expect(href).toContain('🍍');
  });
});
