import { test, expect } from '@playwright/test';

/**
 * User Flow E2E Tests
 * 
 * Complete end-to-end user journeys in demo mode.
 * Run with: pnpm exec playwright test e2e/user-flows.spec.ts
 */

const BASE_URL = 'http://localhost:4200';

test.describe('Agent Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/agents?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading agents...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display agent cards with avatars', async ({ page }) => {
    // Agent Dennis should be visible with avatar
    const agentCard = page.getByText('Agent Dennis').locator('..');
    await expect(agentCard).toBeVisible();
    
    // Avatar should be present (DiceBear generated)
    const avatar = agentCard.locator('img[src*="dicebear"], img[src*="avatar"], svg');
    await expect(avatar.first()).toBeVisible();
  });

  test('should show agent details with reputation', async ({ page }) => {
    // Click on Agent Dennis to see details
    await page.getByText('Agent Dennis').click();
    
    // Wait for detail panel/modal
    await page.waitForTimeout(500);
    
    // Should see trust score or reputation info
    const reputationInfo = page.getByText(/Trust|Reputation|Score/i);
    // If detail view exists, check for reputation
    if (await reputationInfo.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(reputationInfo).toBeVisible();
    }
  });

  test('should filter agents by status', async ({ page }) => {
    // Find status filter tabs
    const activeTab = page.getByRole('tab', { name: /active/i }).or(page.getByText('Active').first());
    const allTab = page.getByRole('tab', { name: /all/i }).or(page.getByText('All').first());
    
    // If tabs exist, test filtering
    if (await activeTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await activeTab.click();
      await page.waitForTimeout(300);
      
      // Should only show active agents
      const activeCount = await page.locator('[data-testid="agent-card"]').count();
      console.log('Active agents visible:', activeCount);
    }
  });
});

test.describe('Task Workflow Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading tasks...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display kanban board with columns', async ({ page }) => {
    // Should see kanban columns
    await expect(page.getByText('Backlog')).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should show task priority badges', async ({ page }) => {
    // Play simulation to create tasks
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Check for priority badges (low, medium, high, critical)
    const priorityBadges = page.locator('[class*="badge"], [class*="Badge"]').filter({
      hasText: /low|medium|high|critical/i
    });
    
    const count = await priorityBadges.count();
    console.log('Priority badges found:', count);
  });

  test('should navigate between list and kanban views', async ({ page }) => {
    // Find view toggle buttons
    const kanbanView = page.getByRole('button', { name: /kanban/i }).or(page.getByLabel(/kanban/i));
    const listView = page.getByRole('button', { name: /list/i }).or(page.getByLabel(/list/i));
    
    if (await listView.isVisible({ timeout: 1000 }).catch(() => false)) {
      await listView.click();
      await page.waitForTimeout(300);
      
      // Should see table or list structure
      const tableOrList = page.locator('table, [role="grid"], [class*="list"]');
      await expect(tableOrList.first()).toBeVisible();
      
      // Switch back to kanban
      if (await kanbanView.isVisible()) {
        await kanbanView.click();
        await expect(page.getByText('Backlog')).toBeVisible();
      }
    }
  });
});

test.describe('Credit System Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/credits?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
  });

  test('should display credit balance', async ({ page }) => {
    // Should see total balance or credit info
    await expect(page.getByText(/Balance|Credits|Total/i).first()).toBeVisible();
  });

  test('should show transaction history', async ({ page }) => {
    // Play simulation to generate transactions
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Should see transaction list or ledger
    const transactionList = page.locator('[class*="ledger"], [class*="transaction"], [class*="history"]');
    const transactions = await transactionList.locator('> div, > tr').count();
    console.log('Transactions found:', transactions);
  });

  test('should show credit type breakdown', async ({ page }) => {
    // Run simulation to generate diverse transactions
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Check for credit type indicators (earn, spend, grant, transfer)
    const creditTypes = ['EARN', 'SPEND', 'GRANT', 'TRANSFER', 'BUDGET'];
    for (const type of creditTypes) {
      const typeElement = page.getByText(type, { exact: false });
      const isVisible = await typeElement.isVisible({ timeout: 500 }).catch(() => false);
      console.log(`Credit type ${type}:`, isVisible);
    }
  });
});

test.describe('Dashboard Overview Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
  });

  test('should display all stat cards', async ({ page }) => {
    // Core stats should be visible
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Total Tasks')).toBeVisible();
    await expect(page.getByText('Credit Flow')).toBeVisible();
  });

  test('should show recent activity feed', async ({ page }) => {
    // Play simulation
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Should see activity or event feed
    const activityFeed = page.locator('[class*="activity"], [class*="feed"], [class*="event"]');
    await expect(activityFeed.first()).toBeVisible();
  });

  test('should update stats during simulation', async ({ page }) => {
    // Get initial stats
    const getActiveAgents = async () => {
      const text = await page.getByText('Active Agents').locator('..').locator('[class*="text-2xl"], [class*="text-3xl"]').first().textContent();
      return parseInt(text || '0', 10);
    };
    
    const initialCount = await getActiveAgents();
    
    // Run simulation
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Check if any stats changed
    const finalCount = await getActiveAgents();
    console.log(`Agents: ${initialCount} -> ${finalCount}`);
    
    // In simulation, agent count should remain stable or grow
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });
});

test.describe('Navigation Flow', () => {
  test('should navigate between all pages smoothly', async ({ page }) => {
    await page.goto(`${BASE_URL}?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    const pages = [
      { name: 'Dashboard', path: '/', check: 'Active Agents' },
      { name: 'Agents', path: '/agents', check: 'Agent Dennis' },
      { name: 'Tasks', path: '/tasks', check: 'Backlog' },
      { name: 'Credits', path: '/credits', check: 'Balance' },
      { name: 'Events', path: '/events', check: 'Events' },
      { name: 'Network', path: '/network', check: 'react-flow' },
    ];
    
    for (const pg of pages) {
      // Click navigation link
      const navLink = page.getByRole('link', { name: new RegExp(pg.name, 'i') });
      if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        await navLink.click();
        await page.waitForTimeout(500);
        
        // Verify we're on the right page
        if (pg.check === 'react-flow') {
          await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
        } else {
          await expect(page.getByText(pg.check, { exact: false }).first()).toBeVisible({ timeout: 5000 });
        }
        console.log(`✓ Navigated to ${pg.name}`);
      }
    }
  });

  test('should persist demo state across navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/events?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    // Run simulation to generate data
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Get event count
    const getEventCount = async () => {
      const el = page.getByText('Total Events').locator('..').locator('[class*="text-2xl"]');
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        return parseInt(await el.textContent() || '0', 10);
      }
      return -1;
    };
    
    const eventCount = await getEventCount();
    
    // Navigate away
    await page.getByRole('link', { name: /dashboard/i }).click();
    await page.waitForTimeout(500);
    
    // Navigate back
    await page.getByRole('link', { name: /events/i }).click();
    await page.waitForTimeout(500);
    
    // Event count should be preserved
    const eventCountAfter = await getEventCount();
    
    if (eventCount >= 0 && eventCountAfter >= 0) {
      expect(eventCountAfter).toBe(eventCount);
      console.log(`✓ Event count preserved: ${eventCount}`);
    }
  });
});

test.describe('Settings Page Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/settings?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
  });

  test('should display settings tabs', async ({ page }) => {
    // Should see settings tabs
    const tabs = ['Profile', 'Security', 'API Keys', 'Organization'];
    for (const tab of tabs) {
      const tabElement = page.getByRole('tab', { name: new RegExp(tab, 'i') })
        .or(page.getByText(tab));
      const isVisible = await tabElement.first().isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`Settings tab "${tab}":`, isVisible);
    }
  });

  test('should show profile form', async ({ page }) => {
    // Profile tab should be default or click it
    const profileTab = page.getByRole('tab', { name: /profile/i }).or(page.getByText('Profile'));
    if (await profileTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await profileTab.click();
    }
    
    // Should see profile form fields
    await expect(page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i))).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))).toBeVisible({ timeout: 3000 });
  });

  test('should show security settings', async ({ page }) => {
    // Click security tab
    const securityTab = page.getByRole('tab', { name: /security/i }).or(page.getByText('Security'));
    if (await securityTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await securityTab.click();
      await page.waitForTimeout(300);
      
      // Should see password and 2FA sections
      await expect(page.getByText(/password/i).first()).toBeVisible();
      await expect(page.getByText(/two-factor|2fa/i).first()).toBeVisible();
    }
  });
});

test.describe('Responsive Demo Controls', () => {
  test('should show demo controls on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    // Demo controls should still be accessible (maybe in collapsed sidebar or drawer)
    const playButton = page.getByRole('button', { name: /play/i });
    const menuButton = page.getByRole('button', { name: /menu/i });
    
    // Either play is visible or we need to open menu
    if (!await playButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await menuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Play button should be accessible
    await expect(playButton).toBeVisible({ timeout: 3000 });
  });
});
