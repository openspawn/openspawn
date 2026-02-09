import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SimulationEngine,
  createSimulation,
  freshScenario,
  growthScenario,
  startupScenario,
  enterpriseScenario,
  acmetechScenario,
  PROJECT_PHASES,
  type SimulationEvent,
  type DemoScenario,
} from '@openspawn/demo-data';
import { setDemoEngine } from './mock-fetcher';
import { celebrate, celebrateLevelUp, celebrateSparkle, celebrateElite } from '../lib/confetti';
import { debug } from '../lib/debug';

export type ScenarioName = 'acmetech' | 'fresh' | 'startup' | 'growth' | 'enterprise';

// Re-export phase info for UI components
export { PROJECT_PHASES };

interface DemoContextValue {
  isDemo: boolean;
  isReady: boolean;
  isPlaying: boolean;
  speed: number;
  currentTick: number;
  scenario: ScenarioName;
  recentEvents: SimulationEvent[];
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  setScenario: (name: ScenarioName, autoPlay?: boolean) => void;
  reset: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    // Return a stub when not in demo mode
    return {
      isDemo: false,
      isReady: true,
      isPlaying: false,
      speed: 1,
      currentTick: 0,
      scenario: 'fresh',
      recentEvents: [],
      play: () => {},
      pause: () => {},
      setSpeed: () => {},
      setScenario: () => {},
      reset: () => {},
    };
  }
  return ctx;
}

const SCENARIOS: Record<ScenarioName, DemoScenario> = {
  acmetech: acmetechScenario,  // Default: Realistic product launch
  fresh: freshScenario,
  startup: startupScenario,
  growth: growthScenario,
  enterprise: enterpriseScenario,
};

function parseScenario(s: string | undefined | null): ScenarioName {
  if (s === 'acmetech' || s === 'fresh' || s === 'startup' || s === 'growth' || s === 'enterprise') return s;
  return 'acmetech'; // Default to AcmeTech product launch
}

interface DemoProviderProps {
  children: ReactNode;
  scenario?: string;
  autoPlay?: boolean;
  initialSpeed?: number;
}

export function DemoProvider({ 
  children, 
  scenario: initialScenarioName,
  autoPlay = false,
  initialSpeed = 1,
}: DemoProviderProps) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeedState] = useState(initialSpeed);
  const [currentTick, setCurrentTick] = useState(0);
  const [scenario, setScenarioState] = useState<ScenarioName>(parseScenario(initialScenarioName));
  const [recentEvents, setRecentEvents] = useState<SimulationEvent[]>([]);
  
  // Ref for stable access
  const engineRef = useRef<SimulationEngine | null>(null);

  // Initialize simulation (no MSW needed!)
  useEffect(() => {
    debug.demo('Initializing simulation...');
    
    // Create simulation engine
    const initialScenario = SCENARIOS[scenario];
    const sim = createSimulation(initialScenario);
    engineRef.current = sim;

    // Connect engine to mock fetcher (this is the key!)
    setDemoEngine(() => engineRef.current);
    
    debug.demo('Ready with scenario:', scenario);
    setIsReady(true);

    return () => {
      engineRef.current?.pause();
    };
  }, []); // Only run once on mount

  // Cooldown tracking for confetti (prevent spam)
  const lastConfettiRef = useRef<number>(0);
  const CONFETTI_COOLDOWN_MS = 8000; // 8 seconds between confetti

  // Trigger confetti based on event type (toned down - only major events)
  const triggerCelebration = useCallback((event: SimulationEvent) => {
    // Check cooldown before firing confetti
    const now = Date.now();
    if (now - lastConfettiRef.current < CONFETTI_COOLDOWN_MS) {
      return; // Skip if on cooldown
    }

    // Only celebrate promotions (rare, meaningful events)
    if (event.type === 'agent_promoted') {
      lastConfettiRef.current = now;
      celebrateLevelUp();
    }
    
    // Special celebration for elite + 100 trust (very rare)
    const payload = event.payload as { agent?: { reputationLevel?: string; trustScore?: number } };
    if (payload?.agent?.reputationLevel === 'ELITE' && payload?.agent?.trustScore === 100) {
      lastConfettiRef.current = now;
      celebrateElite();
    }
  }, []);

  // Subscribe to simulation events
  // Re-subscribe when scenario changes (new engine is created)
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isReady) return;

    // Track recent events for UI display
    const unsubscribeEvent = engine.onEvent((event) => {
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
      // Trigger celebration effects
      triggerCelebration(event);
    });

    // Refetch queries once per tick
    const unsubscribeTick = engine.onTick((events, tick) => {
      debug.demo('Tick', tick, '→', events.length, 'events');
      setCurrentTick(tick);
      
      // Force refetch all active queries (they'll hit mock fetcher)
      if (events.length > 0) {
        queryClient.refetchQueries({ type: 'active' });
      }
    });

    return () => {
      unsubscribeEvent();
      unsubscribeTick();
    };
  }, [isReady, queryClient, scenario, triggerCelebration]);

  // Auto-play if requested
  useEffect(() => {
    if (isReady && autoPlay && engineRef.current && !isPlaying) {
      engineRef.current.play();
      setIsPlaying(true);
    }
  }, [isReady, autoPlay, isPlaying]);

  const play = useCallback(() => {
    engineRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    engineRef.current?.setSpeed(newSpeed);
    setSpeedState(newSpeed);
  }, []);

  const setScenario = useCallback((name: ScenarioName, autoPlay = false) => {
    pause();
    
    // Create new engine with new scenario
    const newScenario = SCENARIOS[name];
    const newEngine = createSimulation(newScenario);
    engineRef.current = newEngine;
    
    // Update mock fetcher reference
    setDemoEngine(() => engineRef.current);
    
    setScenarioState(name);
    setCurrentTick(0);
    setRecentEvents([]);
    
    // Refetch all queries with new scenario data
    queryClient.refetchQueries();
    
    // Auto-play if requested (useful for initial demo start)
    if (autoPlay) {
      // Small delay to ensure engine is ready
      setTimeout(() => {
        engineRef.current?.play();
        setIsPlaying(true);
      }, 50);
    }
    
    debug.demo('Switched to scenario:', name, autoPlay ? '(auto-playing)' : '');
  }, [pause, queryClient]);

  const reset = useCallback(() => {
    setScenario(scenario);
  }, [scenario, setScenario]);

  const value: DemoContextValue = {
    isDemo: true,
    isReady,
    isPlaying,
    speed,
    currentTick,
    scenario,
    recentEvents,
    play,
    pause,
    setSpeed,
    setScenario,
    reset,
  };

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading demo...</p>
        </div>
      </div>
    );
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}
