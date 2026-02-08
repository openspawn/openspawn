/**
 * Guided tour configuration using driver.js
 * Walks users through the key features of OpenSpawn
 */

import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Storage key for tour completion
const TOUR_COMPLETED_KEY = 'openspawn-tour-completed';

// Check if user has completed the tour
export function hasTourCompleted(): boolean {
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
}

// Mark tour as completed
export function markTourCompleted(): void {
  localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
}

// Reset tour (for testing)
export function resetTour(): void {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}

// Tour steps
const tourSteps: DriveStep[] = [
  {
    popover: {
      title: '👋 Welcome to OpenSpawn!',
      description: 'Let\'s take a quick tour of your multi-agent coordination platform. This will only take a minute!',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: '🧭 Navigation',
      description: 'Use the sidebar to navigate between different sections: Dashboard, Tasks, Agents, Credits, and more.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: '📊 Dashboard Overview',
      description: 'Get a quick overview of your system: active agents, pending tasks, credit flow, and recent activity.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="agents-link"]',
    popover: {
      title: '🤖 Agents',
      description: 'Manage your AI agents here. View their status, capabilities, trust scores, and budgets.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tasks-link"]',
    popover: {
      title: '📋 Tasks',
      description: 'Track work across your agent swarm. Tasks flow through: Backlog → Todo → In Progress → Review → Done.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="credits-link"]',
    popover: {
      title: '💰 Credits',
      description: 'Monitor credit spending and earnings. Agents earn credits by completing tasks and spend them on model usage.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="network-link"]',
    popover: {
      title: '🕸️ Network View',
      description: 'Visualize your agent hierarchy. See relationships between agents and who manages whom.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="demo-controls"]',
    popover: {
      title: '🎮 Demo Controls',
      description: 'In demo mode, use these controls to play/pause the simulation, adjust speed, and switch scenarios.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '[data-tour="theme-toggle"]',
    popover: {
      title: '🌓 Theme',
      description: 'Toggle between light and dark mode to suit your preference.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    popover: {
      title: '🚀 You\'re all set!',
      description: 'Start exploring! Try clicking on agents, tasks, or the network view. Hit Play in the demo controls to see the simulation in action.',
      side: 'over',
      align: 'center',
    },
  },
];

// Create and start the tour
export function startTour(onComplete?: () => void): void {
  const driverObj = driver({
    showProgress: true,
    steps: tourSteps,
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Get Started!',
    onDestroyStarted: () => {
      markTourCompleted();
      driverObj.destroy();
      onComplete?.();
    },
    popoverClass: 'openspawn-tour-popover',
  });

  driverObj.drive();
}

// Start tour if not completed (for first-time users)
export function maybeStartTour(onComplete?: () => void): void {
  if (!hasTourCompleted()) {
    // Small delay to let the page render
    setTimeout(() => startTour(onComplete), 500);
  }
}
