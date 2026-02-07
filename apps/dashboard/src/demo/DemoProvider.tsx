import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setupWorker, type SetupWorker } from 'msw/browser';
import {
  SimulationEngine,
  createSimulation,
  freshScenario,
  growthScenario,
  startupScenario,
  enterpriseScenario,
  type SimulationEvent,
  type DemoScenario,
} from '@openspawn/demo-data';
import { createHandlers } from './handlers';

export type ScenarioName = 'fresh' | 'startup' | 'growth' | 'enterprise';

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
  setScenario: (name: ScenarioName) => void;
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
  fresh: freshScenario,
  startup: startupScenario,
  growth: growthScenario,
  enterprise: enterpriseScenario,
};

function parseScenario(s: string | undefined | null): ScenarioName {
  if (s === 'fresh' || s === 'startup' || s === 'growth' || s === 'enterprise') return s;
  return 'fresh'; // Default to fresh start
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
  
  // Refs for stable access in handlers
  const engineRef = useRef<SimulationEngine | null>(null);
  const workerRef = useRef<SetupWorker | null>(null);

  // Initialize MSW and simulation
  useEffect(() => {
    async function init() {
      // Create simulation engine
      const initialScenario = SCENARIOS[scenario];
      const sim = createSimulation(initialScenario);
      engineRef.current = sim;

      // Create handlers that query engine directly (stateless!)
      const handlers = createHandlers(() => engineRef.current);

      // Setup MSW with our handlers
      const mswWorker = setupWorker(...handlers);
      await mswWorker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
      });
      workerRef.current = mswWorker;

      setIsReady(true);
      console.log('[Demo] Initialized with scenario:', scenario);
    }

    init();

    return () => {
      workerRef.current?.stop();
      engineRef.current?.pause();
    };
  }, []); // Only run once on mount

  // Subscribe to simulation events (for UI updates only - no MSW sync needed!)
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isReady) return;

    // Track recent events for UI display
    const unsubscribeEvent = engine.onEvent((event) => {
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
    });

    // Invalidate and refetch queries once per tick (not per event)
    const unsubscribeTick = engine.onTick((events, tick) => {
      console.log('[Demo] Tick', tick, '- events:', events.length, events.map(e => e.type));
      setCurrentTick(tick);
      
      // Force refetch all queries - MSW handlers will fetch fresh data from engine
      if (events.length > 0) {
        console.log('[Demo] Refetching all queries...');
        // Use refetchQueries instead of invalidateQueries for immediate refetch
        queryClient.refetchQueries({ type: 'active' });
      }
    });

    return () => {
      unsubscribeEvent();
      unsubscribeTick();
    };
  }, [isReady, queryClient]);

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

  const setScenario = useCallback((name: ScenarioName) => {
    pause();
    
    // Create new engine with new scenario
    const newScenario = SCENARIOS[name];
    const newEngine = createSimulation(newScenario);
    engineRef.current = newEngine;
    
    setScenarioState(name);
    setCurrentTick(0);
    setRecentEvents([]);
    
    // Invalidate all queries to force refetch with new scenario data
    queryClient.invalidateQueries();
    
    console.log('[Demo] Switched to scenario:', name);
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
