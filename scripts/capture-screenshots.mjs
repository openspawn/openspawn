#!/usr/bin/env node
/**
 * Capture screenshots for documentation
 * Run: node scripts/capture-screenshots.mjs
 * Requires: pnpm exec playwright install chromium
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'docs', 'assets');
const BASE_URL = 'http://localhost:4200';

// Ensure assets directory exists
if (!existsSync(ASSETS_DIR)) {
  mkdirSync(ASSETS_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina quality
    colorScheme: 'dark',
  });
  
  const page = await context.newPage();
  
  // Navigate to demo mode
  const demoUrl = `${BASE_URL}/?demo=true`;
  
  try {
    // 1. Dashboard
    console.log('📸 Capturing dashboard...');
    await page.goto(demoUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Let animations settle
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'dashboard-preview.png'),
      fullPage: false,
    });
    console.log('   ✅ dashboard-preview.png');

    // 2. Network View
    console.log('📸 Capturing network view...');
    await page.goto(`${demoUrl}#/network`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let network graph render
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'network-view.png'),
      fullPage: false,
    });
    console.log('   ✅ network-view.png');

    // 3. Tasks (Kanban)
    console.log('📸 Capturing tasks kanban...');
    await page.goto(`${demoUrl}#/tasks`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'task-kanban.png'),
      fullPage: false,
    });
    console.log('   ✅ task-kanban.png');

    // 4. Credits
    console.log('📸 Capturing credit flow...');
    await page.goto(`${demoUrl}#/credits`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'credit-flow.png'),
      fullPage: false,
    });
    console.log('   ✅ credit-flow.png');

    // 5. Agents
    console.log('📸 Capturing agents page...');
    await page.goto(`${demoUrl}#/agents`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'agents-page.png'),
      fullPage: false,
    });
    console.log('   ✅ agents-page.png');

    // 6. Agents - Reputation Tab
    console.log('📸 Capturing reputation tab...');
    await page.click('[data-value="reputation"]').catch(() => {
      // Try alternative selector
      return page.click('button:has-text("Reputation")');
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: join(ASSETS_DIR, 'reputation-tab.png'),
      fullPage: false,
    });
    console.log('   ✅ reputation-tab.png');

    console.log('\n🎉 All screenshots captured successfully!');
    console.log(`   Location: ${ASSETS_DIR}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    console.log('\n💡 Make sure the dashboard is running:');
    console.log('   pnpm exec nx serve dashboard');
  } finally {
    await browser.close();
  }
}

captureScreenshots();
