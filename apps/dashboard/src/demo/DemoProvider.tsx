import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { setDemoEngine } from './mock-fetcher';
import { celebrate, celebrateLevelUp, celebrateSparkle, celebrateElite } from '../lib/confetti';

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
  
  // Ref for stable access
  const engineRef = useRef<SimulationEngine | null>(null);

  // Initialize simulation (no MSW needed!)
  useEffect(() => {
    console.log('[Demo] Initializing simulation...');
    
    // Create simulation engine
    const initialScenario = SCENARIOS[scenario];
    const sim = createSimulation(initialScenario);
    engineRef.current = sim;

    // Connect engine to mock fetcher (this is the key!)
    setDemoEngine(() => engineRef.current);
    
    console.log('[Demo] Ready with scenario:', scenario);
    setIsReady(true);

    return () => {
      engineRef.current?.pause();
    };
  }, []); // Only run once on mount

  // Event icons and messages
  const getEventInfo = (event: SimulationEvent): { icon: string; message: string; type: 'success' | 'info' | 'warning' } | null => {
    const payload = event.payload as Record<string, unknown>;
    
    switch (event.type) {
      case 'task_completed': {
        const task = payload.task as { title?: string } | undefined;
        return { icon: '✅', message: `Task completed: ${task?.title || 'Unknown'}`, type: 'success' };
      }
      case 'agent_promoted': {
        const agent = payload.agent as { name?: string } | undefined;
        const newLevel = payload.newLevel as number | undefined;
        return { icon: '🚀', message: `${agent?.name || 'Agent'} promoted to L${newLevel}!`, type: 'success' };
      }
      case 'agent_activated': {
        const data = payload as { agent?: { name?: string }; activatedBy?: { name?: string } };
        return { icon: '🎉', message: `${data.agent?.name || 'New agent'} activated by ${data.activatedBy?.name || 'parent'}`, type: 'success' };
      }
      case 'agent_created': {
        const agent = payload as { name?: string };
        return { icon: '🤖', message: `New agent spawned: ${agent?.name || 'Unknown'}`, type: 'info' };
      }
      case 'agent_despawned': {
        const data = payload as { agent?: { name?: string }; newStatus?: string };
        return { icon: '💤', message: `${data.agent?.name || 'Agent'} ${data.newStatus === 'revoked' ? 'terminated' : 'suspended'}`, type: 'warning' };
      }
      case 'credit_earned': {
        const data = payload as { agent?: { name?: string }; amount?: number };
        return { icon: '💰', message: `${data.agent?.name || 'Agent'} earned ${data.amount || 0} credits`, type: 'success' };
      }
      case 'credit_spent': {
        const data = payload as { agent?: { name?: string }; amount?: number };
        return { icon: '💸', message: `${data.agent?.name || 'Agent'} spent ${data.amount || 0} credits`, type: 'info' };
      }
      default:
        return null;
    }
  };

  // Trigger confetti and toast based on event type
  const triggerCelebration = useCallback((event: SimulationEvent) => {
    // Show toast notification
    const eventInfo = getEventInfo(event);
    if (eventInfo) {
      const toastFn = eventInfo.type === 'success' ? toast.success 
        : eventInfo.type === 'warning' ? toast.warning 
        : toast.info;
      toastFn(`${eventInfo.icon} ${eventInfo.message}`, {
        duration: 3000,
      });
    }

    // Trigger confetti for special events
    switch (event.type) {
      case 'task_completed':
        // Task completed - small celebration
        celebrateSparkle();
        break;
      case 'agent_promoted':
        // Agent promoted - level up celebration
        celebrateLevelUp();
        break;
      case 'agent_activated':
        // New agent activated - welcome burst
        celebrate('burst');
        break;
      case 'agent_created':
        // Agent spawned - subtle sparkle (agent still pending)
        // No celebration until activated
        break;
      default:
        // Other events don't trigger celebrations
        break;
    }
    
    // Special celebration for elite reputation
    const payload = event.payload as { agent?: { reputationLevel?: string; trustScore?: number } };
    if (payload?.agent?.reputationLevel === 'ELITE' && payload?.agent?.trustScore === 100) {
      celebrateElite();
    }
  }, []);

  // Subscribe to simulation events
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
      console.log('[Demo] Tick', tick, '→', events.length, 'events');
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
    
    // Update mock fetcher reference
    setDemoEngine(() => engineRef.current);
    
    setScenarioState(name);
    setCurrentTick(0);
    setRecentEvents([]);
    
    // Refetch all queries with new scenario data
    queryClient.refetchQueries();
    
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
