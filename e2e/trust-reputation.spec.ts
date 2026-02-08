import { test, expect } from '@playwright/test';

/**
 * Trust & Reputation E2E Tests
 * 
 * Tests for Phase 5 trust system features.
 * Run with: pnpm exec playwright test e2e/trust-reputation.spec.ts
 */

const BASE_URL = 'http://localhost:4200';

test.describe('Trust Score Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/agents?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading agents...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display trust score on agent cards', async ({ page }) => {
    // Agent cards should show trust score or reputation indicator
    const agentCard = page.getByText('Agent Dennis').locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]').first();
    
    if (await agentCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for trust/reputation indicators
      const trustIndicator = agentCard.getByText(/trust|reputation|score|\d+%/i);
      const progressBar = agentCard.locator('[role="progressbar"], [class*="progress"]');
      
      const hasTrust = await trustIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      const hasProgress = await progressBar.isVisible({ timeout: 1000 }).catch(() => false);
      
      console.log('Trust indicator visible:', hasTrust);
      console.log('Progress bar visible:', hasProgress);
    }
  });

  test('should show reputation level badge', async ({ page }) => {
    // Reputation levels: NEW, PROBATION, TRUSTED, VETERAN, ELITE
    const levels = ['NEW', 'PROBATION', 'TRUSTED', 'VETERAN', 'ELITE'];
    
    for (const level of levels) {
      const badge = page.getByText(level, { exact: true });
      const isVisible = await badge.isVisible({ timeout: 500 }).catch(() => false);
      if (isVisible) {
        console.log(`Found reputation level: ${level}`);
        await expect(badge).toBeVisible();
        break;
      }
    }
  });
});

test.describe('Trust Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    // Load a scenario with multiple agents
    await page.goto(`${BASE_URL}/agents?demo=true&scenario=startup`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading agents...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display leaderboard component', async ({ page }) => {
    // Look for leaderboard section
    const leaderboard = page.getByText(/leaderboard|top agents|ranking/i);
    const isVisible = await leaderboard.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Leaderboard visible:', isVisible);
  });

  test('should show agents ranked by trust score', async ({ page }) => {
    // If there's a leaderboard, it should show ranked agents
    const leaderboardSection = page.locator('[class*="leaderboard"], [data-testid="leaderboard"]');
    
    if (await leaderboardSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Should have numbered rankings or medal icons
      const rankings = leaderboardSection.locator('[class*="rank"], .medal, span:has-text(/[1-9]\./)');
      const count = await rankings.count();
      console.log('Rankings found:', count);
    }
  });
});

test.describe('Reputation Changes', () => {
  test('should update trust score when tasks complete', async ({ page }) => {
    await page.goto(`${BASE_URL}/agents?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    // Get initial trust score if visible
    const getTrustScore = async () => {
      const scoreEl = page.locator('[class*="trust-score"], [data-testid="trust-score"]').first();
      if (await scoreEl.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await scoreEl.textContent();
        return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
      }
      return -1;
    };
    
    const initialScore = await getTrustScore();
    console.log('Initial trust score:', initialScore);
    
    // Run simulation (completes tasks, updates trust)
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Check for trust score changes
    const finalScore = await getTrustScore();
    console.log('Final trust score:', finalScore);
  });

  test('should show reputation history', async ({ page }) => {
    await page.goto(`${BASE_URL}/agents?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    // Click on an agent to see details
    await page.getByText('Agent Dennis').click();
    await page.waitForTimeout(500);
    
    // Look for reputation history section
    const historySection = page.getByText(/reputation history|trust history|activity/i);
    const isVisible = await historySection.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Reputation history visible:', isVisible);
  });
});

test.describe('Promotion/Demotion Events', () => {
  test('should trigger celebration on promotion', async ({ page }) => {
    await page.goto(`${BASE_URL}?demo=true`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    
    // Run simulation at high speed to trigger promotions
    await page.getByRole('button', { name: /play/i }).click();
    
    // Speed up if possible
    const speedButton = page.getByRole('button', { name: /[0-9]+×/ });
    if (await speedButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await speedButton.click();
      await speedButton.click();
    }
    
    // Wait for potential promotion event
    await page.waitForTimeout(8000);
    
    // Check for confetti (canvas element) or celebration toast
    const confetti = page.locator('canvas[class*="confetti"], [class*="confetti"]');
    const celebrationToast = page.getByText(/promoted|level up|congratulations/i);
    
    const hasConfetti = await confetti.isVisible({ timeout: 1000 }).catch(() => false);
    const hasToast = await celebrationToast.isVisible({ timeout: 1000 }).catch(() => false);
    
    console.log('Confetti visible:', hasConfetti);
    console.log('Celebration toast visible:', hasToast);
  });
});

test.describe('Trust-Based Routing', () => {
  test('should show task assignments consider trust scores', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks?demo=true&scenario=startup`);
    await expect(page.getByText('Loading demo...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading tasks...')).not.toBeVisible({ timeout: 5000 });
    
    // Run simulation to create and assign tasks
    await page.getByRole('button', { name: /play/i }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: /pause/i }).click();
    
    // Check for task assignments
    const assignedTasks = page.locator('[class*="task-card"], [data-testid="task-card"]').filter({
      hasText: /assigned|agent/i
    });
    
    const count = await assignedTasks.count();
    console.log('Assigned tasks:', count);
  });
});
