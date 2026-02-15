import { useEffect, useCallback, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../../styles/driver-theme.css';
import { useOnboarding } from './onboarding-provider';
import { useDemo } from '../../demo/DemoProvider';

const TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="dashboard"]',
    popover: {
      title: 'Your Command Center',
      description:
        "Get a bird's-eye view of your entire agent ecosystem — active agents, tasks, credits, and live activity all in one place.",
    },
  },
  {
    element: '[data-tour="agents"]',
    popover: {
      title: 'Your Agents',
      description:
        'Browse, monitor, and manage all your AI agents. See their status, capabilities, and performance at a glance.',
    },
  },
  {
    element: '[data-tour="tasks"]',
    popover: {
      title: 'Task Board',
      description:
        'Your task board shows everything in flight — from backlog to done. Agents pick up work and report progress in real-time.',
    },
  },
  {
    element: '[data-tour="network"]',
    popover: {
      title: 'Agent Network',
      description:
        'The network graph reveals how agents interact, delegate, and collaborate. Watch relationships form in real-time.',
    },
  },
  {
    element: '[data-tour="cmdk"]',
    popover: {
      title: 'Quick Search',
      description:
        'Press ⌘K (or Ctrl+K) to instantly search agents, tasks, pages, and actions. The fastest way to navigate.',
    },
  },
];

const DONT_SHOW_KEY = 'openspawn-tour-dismissed';

export function FeatureTour() {
  const { isOnboarding, skipOnboarding } = useOnboarding();
  const { isDemo } = useDemo();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const handleComplete = useCallback(() => {
    skipOnboarding();
  }, [skipOnboarding]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DONT_SHOW_KEY, 'true');
    skipOnboarding();
  }, [skipOnboarding]);

  useEffect(() => {
    // Don't show tour while DemoWelcome modal is still open
    const demoWelcomeOpen =
      isDemo && !localStorage.getItem('openspawn-demo-welcomed');
    if (!isOnboarding || demoWelcomeOpen) return;

    // User previously chose "Don't show again"
    if (localStorage.getItem(DONT_SHOW_KEY)) {
      skipOnboarding();
      return;
    }

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      popoverClass: 'ocean-tour',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Finish',
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        // If the tour isn't on the last step, treat as early dismissal
        if (
          driverInstance.getActiveIndex() !==
          TOUR_STEPS.length - 1
        ) {
          handleDismiss();
        } else {
          handleComplete();
        }
        driverInstance.destroy();
      },
      onDestroyed: () => {
        // Fallback — ensure onboarding completes
        handleComplete();
      },
    });

    driverRef.current = driverInstance;

    // Small delay to let the DOM settle before highlighting
    const timer = setTimeout(() => {
      driverInstance.drive();
    }, 300);

    return () => {
      clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [isOnboarding, isDemo, skipOnboarding, handleComplete, handleDismiss]);

  // driver.js manages its own DOM — no React rendering needed
  return null;
}
