import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';
const SCREENSHOT_DIR = 'docs/assets';

test.describe('Documentation Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('dashboard preview', async ({ page }) => {
    // Use startup scenario for populated data
    await page.goto(`${BASE_URL}/?demo=true&scenario=startup`);
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Wait for data to populate
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/dashboard-preview.png`,
      fullPage: false
    });
  });

  test('network view', async ({ page }) => {
    // Use growth scenario for more agents
    await page.goto(`${BASE_URL}/network?demo=true&scenario=growth`);
    
    // Wait for network to render
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Wait for layout to settle
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/network-view.png`,
      fullPage: false
    });
  });

  test('task kanban', async ({ page }) => {
    // Use startup scenario for tasks
    await page.goto(`${BASE_URL}/tasks?demo=true&scenario=startup`);
    
    // Wait for kanban to load
    await page.waitForSelector('text=Tasks', { timeout: 10000 });
    
    // Wait for tasks to populate
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/task-kanban.png`,
      fullPage: false
    });
  });

  test('credit flow', async ({ page }) => {
    // Use growth scenario for credit history
    await page.goto(`${BASE_URL}/credits?demo=true&scenario=growth`);
    
    // Wait for credits page
    await page.waitForSelector('text=Credits', { timeout: 10000 });
    
    // Wait for transactions
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/credit-flow.png`,
      fullPage: false
    });
  });
});
