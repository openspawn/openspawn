import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

export interface TourStep {
  id: string;
  path: string;
  title: string;
  description: string;
  /** CSS selector for the element to spotlight (optional — if omitted, no spotlight) */
  spotlightSelector?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'live-start',
    path: '/live',
    title: 'Live View',
    description: 'Watch 22 agents coordinate a 10,000 order in real time',
  },
  {
    id: 'agents',
    path: '/agents',
    title: 'Agents',
    description: 'Every agent has a role, trust score, and real-time stats',
    spotlightSelector: '[data-tour="agent-list"]',
  },
  {
    id: 'tasks',
    path: '/tasks',
    title: 'Tasks',
    description: 'Tasks flow through a pipeline: backlog → assigned → in-progress → done',
    spotlightSelector: '[data-tour="task-list"]',
  },
  {
    id: 'dashboard',
    path: '/',
    title: 'Dashboard',
    description: 'Executive overview with live charts and org health',
    spotlightSelector: '[data-tour="dashboard-charts"]',
  },
  {
    id: 'router',
    path: '/router',
    title: 'Model Router',
    description: 'The Model Router picks the cheapest LLM provider for each decision',
    spotlightSelector: '[data-tour="router-cards"]',
  },
  {
    id: 'network',
    path: '/network',
    title: 'Network',
    description: 'Visualize the full org graph and communication flows',
    spotlightSelector: '[data-tour="network-viz"]',
  },
  {
    id: 'live-end',
    path: '/live',
    title: 'Live View',
    description: 'Back to the action — watch the final delivery rush',
  },
];

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  autoAdvance: boolean;
  setAutoAdvance: (v: boolean) => void;
  start: () => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

export function useTourSafe() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const navigateToStep = useCallback((stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex];
    if (step) {
      navigate({ to: step.path });
    }
  }, [navigate]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    navigateToStep(0);
  }, [navigateToStep]);

  const exit = useCallback(() => {
    clearTimer();
    setIsActive(false);
    setCurrentStep(0);
  }, [clearTimer]);

  const next = useCallback(() => {
    clearTimer();
    setCurrentStep(prev => {
      const nextStep = prev + 1;
      if (nextStep >= TOUR_STEPS.length) {
        setIsActive(false);
        return 0;
      }
      navigateToStep(nextStep);
      return nextStep;
    });
  }, [clearTimer, navigateToStep]);

  const prev = useCallback(() => {
    clearTimer();
    setCurrentStep(prev => {
      const prevStep = Math.max(0, prev - 1);
      navigateToStep(prevStep);
      return prevStep;
    });
  }, [clearTimer, navigateToStep]);

  // Auto-advance timer
  useEffect(() => {
    if (!isActive || !autoAdvance) {
      clearTimer();
      return;
    }
    // First step gets 10s (let replay start), others get 8s
    const delay = currentStep === 0 ? 10000 : 8000;
    timerRef.current = setTimeout(() => {
      next();
    }, delay);
    return clearTimer;
  }, [isActive, autoAdvance, currentStep, next, clearTimer]);

  return (
    <TourContext.Provider value={{ isActive, currentStep, steps: TOUR_STEPS, autoAdvance, setAutoAdvance, start, next, prev, exit }}>
      {children}
    </TourContext.Provider>
  );
}
