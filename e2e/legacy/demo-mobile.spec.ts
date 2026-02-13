import { test, expect } from '@playwright/test';

test.use({ 
  baseURL: 'http://localhost:4200',
});

// Skip webServer - use already running server
test.describe('Demo controls mobile', () => {
  test('iPhone SE viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    
    await page.goto('/network?demo=true');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    
    await page.screenshot({ 
      path: 'e2e/screenshots/demo-mobile-iphone-se.png',
    });
    
    await context.close();
  });

  test('iPhone 12 viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    
    await page.goto('/network?demo=true');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    
    await page.screenshot({ 
      path: 'e2e/screenshots/demo-mobile-iphone-12.png',
    });
    
    await context.close();
  });
});
