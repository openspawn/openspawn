import { test, expect } from '@playwright/test';

test('debug demo events page - fresh scenario', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:4200/events?demo=true');
  
  // Wait for demo to initialize
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'e2e/screenshots/debug-fresh-events.png', fullPage: true });
  
  // Log the page content for debugging
  const pageText = await page.textContent('body');
  console.log('Page text (first 3000 chars):', pageText?.substring(0, 3000));
  
  // Check the ScrollArea content specifically
  const scrollContent = await page.locator('[data-radix-scroll-area-viewport]').textContent();
  console.log('Scroll area content:', scrollContent?.substring(0, 1000));
  
  // Check for any italic text (where reasoning would be)
  const italicTexts = await page.locator('p.italic').allTextContents();
  console.log('Italic texts (reasoning):', italicTexts);
  
  // Check stats
  const totalEvents = await page.locator('text=Total Events').locator('..').locator('div.text-2xl').textContent();
  console.log('Total Events stat:', totalEvents);
});
