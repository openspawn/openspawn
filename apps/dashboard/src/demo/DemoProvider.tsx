import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
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
import {
  handlers,
  setAgents,
  setTasks,
  setCredits,
  setEvents,
  addAgent,
  addTask,
  addCredit,
  addEvent,
  updateAgent,
  updateTask,
} from './handlers';

export type ScenarioName = 'fresh' | 'startup' | 'growth' | 'enterprise';

interface DemoContextValue {
  isDemo: boolean;
  isReady: boolean;
  isPlaying: boolean;
  speed: number;
  currentTick: number;
  scenario: ScenarioName;
  recentEvents: SimulationEvent[];
  agentSpawns: string[]; // Recently spawned agent IDs for animations
  agentDespawns: string[]; // Recently despawned agent IDs for animations
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
      agentSpawns: [],
      agentDespawns: [],
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
  const [worker, setWorker] = useState<SetupWorker | null>(null);
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeedState] = useState(initialSpeed);
  const [currentTick, setCurrentTick] = useState(0);
  const [scenario, setScenarioState] = useState<ScenarioName>(parseScenario(initialScenarioName));
  const [recentEvents, setRecentEvents] = useState<SimulationEvent[]>([]);
  const [agentSpawns, setAgentSpawns] = useState<string[]>([]);
  const [agentDespawns, setAgentDespawns] = useState<string[]>([]);

  // Initialize MSW and simulation
  useEffect(() => {
    async function init() {
      // Setup MSW
      const mswWorker = setupWorker(...handlers);
      await mswWorker.start({
        onUnhandledRequest: 'bypass', // Let real requests through
        quiet: true,
      });
      setWorker(mswWorker);

      // Load initial scenario
      const initialScenario = SCENARIOS[scenario];
      setAgents(initialScenario.agents);
      setTasks(initialScenario.tasks);
      setCredits(initialScenario.credits);
      setEvents(initialScenario.events);

      // Create simulation engine
      const sim = createSimulation(initialScenario);
      setEngine(sim);

      setIsReady(true);
    }

    init();

    return () => {
      worker?.stop();
    };
  }, []);

  // Subscribe to simulation events (for MSW state updates)
  useEffect(() => {
    if (!engine) return;

    const unsubscribeEvent = engine.onEvent((event) => {
      // Update MSW state based on event type
      switch (event.type) {
        case 'agent_created': {
          const newAgent = event.payload as any;
          addAgent(newAgent);
          // Track spawn for animation
          setAgentSpawns((prev) => [...prev, newAgent.id]);
          // Clear spawn after animation
          setTimeout(() => {
            setAgentSpawns((prev) => prev.filter((id) => id !== newAgent.id));
          }, 2000);
          break;
        }
        case 'agent_activated': {
          // Parent activated a pending child
          const activatedPayload = event.payload as { agent: any; activatedBy: any };
          updateAgent(activatedPayload.agent.id, activatedPayload.agent);
          break;
        }
        case 'agent_promoted':
        case 'agent_terminated': {
          const agentPayload = event.payload as { agent: any; newStatus?: string };
          updateAgent(agentPayload.agent.id, agentPayload.agent);
          // Track despawn (status change to inactive states)
          if (agentPayload.newStatus === 'paused' || agentPayload.newStatus === 'suspended' || agentPayload.newStatus === 'revoked') {
            setAgentDespawns((prev) => [...prev, agentPayload.agent.id]);
            setTimeout(() => {
              setAgentDespawns((prev) => prev.filter((id) => id !== agentPayload.agent.id));
            }, 2000);
          }
          break;
        }
        case 'task_created':
          addTask(event.payload as any);
          break;
        case 'task_assigned':
        case 'task_completed': {
          const taskPayload = event.payload as { task: any };
          updateTask(taskPayload.task.id, taskPayload.task);
          break;
        }
        case 'credit_earned':
        case 'credit_spent': {
          const creditPayload = event.payload as { transaction: any; agent: any };
          addCredit(creditPayload.transaction);
          updateAgent(creditPayload.agent.id, creditPayload.agent);
          break;
        }
      }

      // Keep last 20 events for UI
      setRecentEvents((prev) => [event, ...prev].slice(0, 20));
    });

    // Subscribe to tick events (for query invalidation - once per tick, not per event)
    const unsubscribeTick = engine.onTick((events, tick) => {
      setCurrentTick(tick);
      
      // Invalidate all queries once per tick - elegant and efficient
      if (events.length > 0) {
        queryClient.invalidateQueries();
      }
    });

    return () => {
      unsubscribeEvent();
      unsubscribeTick();
    };
  }, [engine, queryClient]);

  // Auto-play if requested
  useEffect(() => {
    if (isReady && autoPlay && engine && !isPlaying) {
      engine.play();
      setIsPlaying(true);
    }
  }, [isReady, autoPlay, engine]);

  const play = useCallback(() => {
    engine?.play();
    setIsPlaying(true);
  }, [engine]);

  const pause = useCallback(() => {
    engine?.pause();
    setIsPlaying(false);
  }, [engine]);

  const setSpeed = useCallback((newSpeed: number) => {
    engine?.setSpeed(newSpeed);
    setSpeedState(newSpeed);
  }, [engine]);

  const setScenario = useCallback((name: ScenarioName) => {
    pause();
    
    const newScenario = SCENARIOS[name];
    setAgents(newScenario.agents);
    setTasks(newScenario.tasks);
    setCredits(newScenario.credits);
    setEvents(newScenario.events);
    
    const newEngine = createSimulation(newScenario);
    setEngine(newEngine);
    setScenarioState(name);
    
    // Invalidate all queries to force refetch with new scenario data
    queryClient.invalidateQueries();
    setCurrentTick(0);
    setRecentEvents([]);
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
    agentSpawns,
    agentDespawns,
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
