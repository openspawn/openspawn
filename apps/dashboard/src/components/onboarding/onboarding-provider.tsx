import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'bb-onboarding-complete';
const TOTAL_STEPS = 5;

interface OnboardingContextType {
  /** Whether the user has completed (or skipped) onboarding */
  hasCompletedOnboarding: boolean;
  /** Whether the onboarding flow is currently active */
  isOnboarding: boolean;
  /** Whether to show the welcome screen (step 0) */
  showWelcome: boolean;
  /** Current tour step (1-indexed, 0 = welcome screen) */
  currentStep: number;
  /** Total number of tour steps */
  totalSteps: number;
  /** Whether the celebration screen is showing */
  showCelebration: boolean;
  /** Start the onboarding tour (moves past welcome to step 1) */
  startOnboarding: () => void;
  /** Go to the next step */
  nextStep: () => void;
  /** Go to the previous step */
  prevStep: () => void;
  /** Skip the entire onboarding */
  skipOnboarding: () => void;
  /** Reset onboarding so it shows again */
  resetOnboarding: () => void;
  /** Dismiss the celebration and finish */
  dismissCelebration: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const markComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
    setIsOnboarding(false);
    setShowWelcome(false);
    setCurrentStep(0);
  }, []);

  const startOnboarding = useCallback(() => {
    setShowWelcome(false);
    setIsOnboarding(true);
    setCurrentStep(1);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TOTAL_STEPS) {
        // Tour complete — show celebration
        setIsOnboarding(false);
        setShowCelebration(true);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    markComplete();
  }, [markComplete]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasCompletedOnboarding(false);
    setShowWelcome(true);
    setCurrentStep(0);
    setIsOnboarding(false);
    setShowCelebration(false);
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
    markComplete();
  }, [markComplete]);

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isOnboarding,
        showWelcome,
        currentStep,
        totalSteps: TOTAL_STEPS,
        showCelebration,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        resetOnboarding,
        dismissCelebration,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
