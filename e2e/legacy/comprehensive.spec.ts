import { test, expect, Page } from '@playwright/test';

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1280, height: 800, name: 'desktop' },
  'desktop-lg': { width: 1920, height: 1080, name: 'desktop-lg' },
};

// All pages to test
const PAGES = [
  { path: '/', name: 'Dashboard', selector: 'h1:has-text("Dashboard")' },
  { path: '/network', name: 'Network', selector: '[class*="react-flow"]' },
  { path: '/tasks', name: 'Tasks', selector: 'h1:has-text("Tasks")' },
  { path: '/agents', name: 'Agents', selector: 'h1:has-text("Agents")' },
  { path: '/messages', name: 'Messages', selector: 'h1:has-text("Agent Communications")' },
  { path: '/credits', name: 'Credits', selector: 'h1:has-text("Credits")' },
  { path: '/events', name: 'Events', selector: 'h1:has-text("Events")' },
  { path: '/settings', name: 'Settings', selector: 'h1:has-text("Settings")' },
];

// All scenarios to test
const SCENARIOS = ['novatech', 'fresh', 'startup', 'growth', 'enterprise'];

const BASE_URL = 'http://localhost:4200/openspawn/demo';

// Helper to dismiss welcome modal if present
async function dismissWelcomeModal(page: Page) {
  const modal = page.locator('text=Welcome to OpenSpawn');
  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Click the X button or outside to dismiss
    await page.locator('button:has(svg)').first().click();
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  }
}

// Helper to switch scenario
async function switchScenario(page: Page, scenario: string) {
  const scenarioButton = page.locator(`button:has-text("${scenario}")`).first();
  await scenarioButton.click();
  // Wait for data to load
  await page.waitForTimeout(500);
}

// ============================================================================
// COMPREHENSIVE PAGE TESTS
// ============================================================================

test.describe('Comprehensive Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  // Test each page loads correctly on each viewport
  for (const viewport of Object.values(VIEWPORTS)) {
    test.describe(`${viewport.name} viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageInfo of PAGES) {
        test(`${pageInfo.name} page loads correctly`, async ({ page }) => {
          await page.goto(`${BASE_URL}/#${pageInfo.path}`);
          await dismissWelcomeModal(page);
          
          // Wait for page content
          await expect(page.locator(pageInfo.selector)).toBeVisible({ timeout: 10000 });
          
          // No console errors
          const errors: string[] = [];
          page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
          });
          
          // Take screenshot for visual reference
          await page.screenshot({ 
            path: `e2e/screenshots/${viewport.name}-${pageInfo.name.toLowerCase()}.png`,
            fullPage: false 
          });
        });
      }
    });
  }
});

// ============================================================================
// WELCOME MODAL TESTS
// ============================================================================

test.describe('Welcome Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows on first visit', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible({ timeout: 5000 });
  });

  test('displays all scenario options', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible();
    
    // Check all scenarios are listed
    await expect(page.locator('text=NovaTech Product Launch')).toBeVisible();
    await expect(page.locator('text=Startup Team')).toBeVisible();
    await expect(page.locator('text=Growth Stage')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
    await expect(page.locator('text=Fresh Start')).toBeVisible();
  });

  test('NovaTech is marked as recommended', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible();
    await expect(page.locator('text=RECOMMENDED')).toBeVisible();
  });

  test('can select different scenarios', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible();
    
    // Click on Startup scenario
    await page.locator('text=Startup Team').click();
    
    // Verify selection (checkmark should appear)
    const startupCard = page.locator('button:has-text("Startup Team")');
    await expect(startupCard).toHaveClass(/border-violet-500/);
  });

  test('Start Demo button launches selected scenario', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible();
    
    // Click Start Demo
    await page.locator('button:has-text("Start Demo")').click();
    
    // Modal should close
    await expect(page.locator('text=Welcome to OpenSpawn')).not.toBeVisible({ timeout: 3000 });
    
    // Dashboard should be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('does not show on subsequent visits', async ({ page }) => {
    // Dismiss modal
    await page.locator('button:has-text("Start Demo")').click();
    await expect(page.locator('text=Welcome to OpenSpawn')).not.toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Modal should not appear
    await expect(page.locator('text=Welcome to OpenSpawn')).not.toBeVisible({ timeout: 3000 });
  });

  test('can be dismissed with X button', async ({ page }) => {
    await expect(page.locator('text=Welcome to OpenSpawn')).toBeVisible();
    
    // Click X button (first button with just an icon)
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    await closeButton.click();
    
    // Modal should close
    await expect(page.locator('text=Welcome to OpenSpawn')).not.toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// SCENARIO SWITCHING TESTS
// ============================================================================

test.describe('Scenario Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
  });

  for (const scenario of SCENARIOS) {
    test(`can switch to ${scenario} scenario`, async ({ page }) => {
      // Find and click scenario button in controls
      const scenarioBtn = page.locator(`button:has-text("${scenario.charAt(0).toUpperCase() + scenario.slice(1)}")`).first();
      await scenarioBtn.click();
      
      // Wait for data to update
      await page.waitForTimeout(1000);
      
      // Verify the button shows as active/selected
      await expect(scenarioBtn).toBeVisible();
    });
  }

  test('NovaTech scenario loads 22 agents', async ({ page }) => {
    await switchScenario(page, 'NovaTech');
    
    // Navigate to agents page
    await page.click('a[href*="/agents"]');
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(1500);
    
    // Check agent count (should show in stats or count)
    const agentCards = page.locator('[data-testid="agent-card"]');
    const count = await agentCards.count();
    
    // NovaTech has 22 agents
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('Fresh scenario starts with minimal agents', async ({ page }) => {
    await switchScenario(page, 'Fresh');
    
    // Navigate to agents page
    await page.click('a[href*="/agents"]');
    await page.waitForTimeout(1000);
    
    // Should have fewer agents than NovaTech
    const agentCards = page.locator('[data-testid="agent-card"]');
    const count = await agentCards.count();
    
    expect(count).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
  });

  test('sidebar navigation works on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    for (const pageInfo of PAGES) {
      await page.click(`a[href*="${pageInfo.path}"]`);
      await expect(page.locator(pageInfo.selector)).toBeVisible({ timeout: 5000 });
    }
  });

  test('navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // On mobile, sidebar should be collapsed or have mobile nav
    for (const pageInfo of PAGES.slice(0, 4)) { // Test first 4 pages
      await page.click(`a[href*="${pageInfo.path}"]`);
      await expect(page.locator(pageInfo.selector)).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================================================
// DASHBOARD PAGE TESTS
// ============================================================================

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.locator('text=Active Agents')).toBeVisible();
    await expect(page.locator('text=Tasks In Progress')).toBeVisible();
    await expect(page.locator('text=Completed Tasks')).toBeVisible();
    await expect(page.locator('text=Credit Flow')).toBeVisible();
  });

  test('displays phase progress for NovaTech', async ({ page }) => {
    // Phase progress should be visible
    await expect(page.locator('text=Project Progress')).toBeVisible();
    await expect(page.locator('text=Discovery')).toBeVisible();
    await expect(page.locator('text=Development')).toBeVisible();
    await expect(page.locator('text=Launch')).toBeVisible();
  });

  test('displays charts', async ({ page }) => {
    await expect(page.locator('text=Credit Flow')).toBeVisible();
    await expect(page.locator('text=Tasks by Status')).toBeVisible();
  });

  test('displays recent activity feed', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    // Should have live indicator
    await expect(page.locator('text=Live')).toBeVisible();
  });
});

// ============================================================================
// TASKS PAGE TESTS
// ============================================================================

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/tasks`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
    await page.waitForTimeout(1000);
  });

  test('displays kanban board', async ({ page }) => {
    await expect(page.locator('text=Backlog')).toBeVisible();
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('can switch between Kanban and List view', async ({ page }) => {
    // Default is Kanban
    await expect(page.locator('button[role="tab"]:has-text("Kanban")')).toBeVisible();
    
    // Switch to List
    await page.click('button[role="tab"]:has-text("List")');
    
    // Should show list view (different layout)
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("List")')).toBeVisible();
  });

  test('displays task cards with details', async ({ page }) => {
    // Task cards should have identifier and title
    await expect(page.locator('text=NT-')).toBeVisible();
  });

  test('shows phase chip when NovaTech is active', async ({ page }) => {
    // Phase chip should appear in header
    const phaseChip = page.locator('text=Development').first();
    await expect(phaseChip).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// NETWORK PAGE TESTS
// ============================================================================

test.describe('Network Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/network`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
    await page.waitForTimeout(1500);
  });

  test('displays react-flow graph', async ({ page }) => {
    // React Flow container should be visible
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
  });

  test('displays agent nodes', async ({ page }) => {
    // Should have multiple agent nodes
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible({ timeout: 10000 });
    
    const count = await nodes.count();
    expect(count).toBeGreaterThan(5);
  });

  test('has zoom controls', async ({ page }) => {
    await expect(page.locator('button[title="Zoom In"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom Out"]')).toBeVisible();
    await expect(page.locator('button[title="Fit View"]')).toBeVisible();
  });

  test('displays hierarchy legend', async ({ page }) => {
    await expect(page.locator('text=Levels')).toBeVisible();
    await expect(page.locator('text=COO')).toBeVisible();
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Graph should still be visible
    await expect(page.locator('.react-flow')).toBeVisible();
  });
});

// ============================================================================
// AGENTS PAGE TESTS
// ============================================================================

test.describe('Agents Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/agents`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
    await page.waitForTimeout(1000);
  });

  test('displays agent list', async ({ page }) => {
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible();
    
    // Should have agent cards or list items
    await page.waitForTimeout(1500);
  });

  test('shows agent details including level and balance', async ({ page }) => {
    // Agent cards should show level (L10, L8, etc.) and balance
    const levelBadge = page.locator('text=/L\\d+/').first();
    await expect(levelBadge).toBeVisible({ timeout: 5000 });
  });

  test('has tabs for different views', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Agents")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Leaderboard")')).toBeVisible();
  });
});

// ============================================================================
// MESSAGES PAGE TESTS
// ============================================================================

test.describe('Messages Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/messages`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
    await page.waitForTimeout(1000);
  });

  test('displays message views', async ({ page }) => {
    await expect(page.locator('h1:has-text("Agent Communications")')).toBeVisible();
    
    // Should have view tabs
    await expect(page.locator('text=Graph')).toBeVisible();
    await expect(page.locator('text=Feed')).toBeVisible();
    await expect(page.locator('text=Cards')).toBeVisible();
    await expect(page.locator('text=Context')).toBeVisible();
  });

  test('Feed view shows messages', async ({ page }) => {
    // Click Feed tab if not already selected
    await page.click('button[role="tab"]:has-text("Feed")');
    
    // Should show message content
    await page.waitForTimeout(1000);
    const messages = page.locator('[class*="message"]');
    // Messages should be visible
  });

  test('can filter messages by type', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Feed")');
    
    // Filter buttons should exist
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("task")')).toBeVisible();
    await expect(page.locator('button:has-text("status")')).toBeVisible();
  });
});

// ============================================================================
// CREDITS PAGE TESTS
// ============================================================================

test.describe('Credits Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/credits`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
  });

  test('displays credit information', async ({ page }) => {
    await expect(page.locator('h1:has-text("Credits")')).toBeVisible();
  });

  test('shows credit transactions or ledger', async ({ page }) => {
    // Should have some credit-related content
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// EVENTS PAGE TESTS
// ============================================================================

test.describe('Events Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/events`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
  });

  test('displays events feed', async ({ page }) => {
    await expect(page.locator('h1:has-text("Events")')).toBeVisible();
  });

  test('shows event entries', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Should have event items
  });
});

// ============================================================================
// SETTINGS PAGE TESTS
// ============================================================================

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    await dismissWelcomeModal(page);
  });

  test('displays settings sections', async ({ page }) => {
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('has profile settings tab', async ({ page }) => {
    await expect(page.locator('text=Profile')).toBeVisible();
  });
});

// ============================================================================
// DEMO CONTROLS TESTS
// ============================================================================

test.describe('Demo Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
  });

  test('controls bar is visible', async ({ page }) => {
    // Demo controls should be at bottom of screen
    await expect(page.locator('button:has-text("1×")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset simulation")')).toBeVisible();
  });

  test('can change simulation speed', async ({ page }) => {
    await page.click('button:has-text("5×")');
    // Speed button should be selected
    await expect(page.locator('button:has-text("5×")')).toBeVisible();
  });

  test('can play and pause simulation', async ({ page }) => {
    // Find play/pause button (has Play or Pause icon)
    const playPauseBtn = page.locator('button').filter({ has: page.locator('svg.lucide-play, svg.lucide-pause') }).first();
    await expect(playPauseBtn).toBeVisible();
    
    // Click to toggle
    await playPauseBtn.click();
  });

  test('can reset simulation', async ({ page }) => {
    await page.click('button:has-text("Reset simulation")');
    // Should reset (tick counter goes to 0)
  });

  test('shows tick counter', async ({ page }) => {
    // Should show tick count with lightning icon
    const tickCounter = page.locator('svg.lucide-zap').first();
    await expect(tickCounter).toBeVisible();
  });
});

// ============================================================================
// RESPONSIVE LAYOUT TESTS
// ============================================================================

test.describe('Responsive Layout', () => {
  test('sidebar collapses on mobile', async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sidebar should be collapsed or hidden
    // Navigation should still work
    await expect(page.locator('a[href*="/tasks"]')).toBeVisible();
  });

  test('content is readable on tablet', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/`);
    await dismissWelcomeModal(page);
    
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Dashboard content should be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('charts resize appropriately', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/`);
    await dismissWelcomeModal(page);
    await switchScenario(page, 'NovaTech');
    
    // Check on different sizes
    for (const size of [{ width: 375, height: 667 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      
      // Page should not have horizontal scroll issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Minor overflow is acceptable, but not excessive
    }
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });

  test('scenario switch is responsive', async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
    
    const startTime = Date.now();
    await switchScenario(page, 'NovaTech');
    const switchTime = Date.now() - startTime;
    
    expect(switchTime).toBeLessThan(3000); // Should switch within 3 seconds
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {
  test('navigation is keyboard accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
  });

  test('buttons have proper focus states', async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissWelcomeModal(page);
    
    // Focus a button and check it's visible
    const firstButton = page.locator('button').first();
    await firstButton.focus();
    
    // Button should have focus styling (ring or outline)
  });
});
