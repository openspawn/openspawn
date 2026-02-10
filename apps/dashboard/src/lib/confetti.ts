/**
 * Confetti celebration effects for BikiniBottom dashboard
 * Uses canvas-confetti for lightweight, performant animations
 */

import confetti from 'canvas-confetti';

// Default confetti colors matching our theme
const THEME_COLORS = ['#f472b6', '#a78bfa', '#22c55e', '#06b6d4', '#fbbf24'];

// Gold/celebration colors
const CELEBRATION_COLORS = ['#ffd700', '#ffec8b', '#ffa500', '#ff6347', '#ff69b4'];

// Level-up colors (purple/gold)
const LEVEL_UP_COLORS = ['#a78bfa', '#c4b5fd', '#ffd700', '#ffec8b', '#f472b6'];

/**
 * Standard celebration burst (task completed, etc.)
 */
export function celebrateBurst() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: THEME_COLORS,
  });
}

/**
 * Side cannons effect (bigger achievements)
 */
export function celebrateCannons() {
  const end = Date.now() + 500;
  const colors = CELEBRATION_COLORS;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Level up / promotion celebration (stars + confetti) - subtle version
 */
export function celebrateLevelUp() {
  // Single burst instead of continuous animation
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: LEVEL_UP_COLORS,
    shapes: ['star', 'circle'],
    scalar: 1.1,
  });
}

/**
 * Fireworks effect (major milestones)
 */
export function celebrateFireworks() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: CELEBRATION_COLORS,
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: CELEBRATION_COLORS,
    });
  }, 250);
}

/**
 * Subtle sparkle (small wins)
 */
export function celebrateSparkle() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: THEME_COLORS,
    scalar: 0.8,
    gravity: 1.2,
  });
}

/**
 * Elite agent celebration (gold burst) - subtle version
 */
export function celebrateElite() {
  const colors = ['#ffd700', '#ffec8b', '#daa520', '#b8860b'];
  
  // Single elegant gold burst
  confetti({
    particleCount: 60,
    spread: 80,
    origin: { y: 0.5 },
    colors,
    shapes: ['circle', 'star'],
    scalar: 1.2,
  });
}

// Celebration types mapped to functions
export const celebrations = {
  burst: celebrateBurst,
  cannons: celebrateCannons,
  levelUp: celebrateLevelUp,
  fireworks: celebrateFireworks,
  sparkle: celebrateSparkle,
  elite: celebrateElite,
} as const;

export type CelebrationType = keyof typeof celebrations;

/**
 * Trigger a celebration by type
 */
export function celebrate(type: CelebrationType = 'burst') {
  celebrations[type]();
}
