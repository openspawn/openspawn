import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DemoScenario, SimulationEvent } from '@openspawn/demo-data';
import { SimulationEngine, createSimulation, getScenario } from '@openspawn/demo-data';
import { demoState } from './handlers';

interface DemoContextValue {
  isDemo: boolean;
  isPlaying: boolean;
  speed: number;
  tick: number;
  scenario: string;
  scenarioData: DemoScenario | null;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  jumpToTick: (tick: number) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemoContext(): DemoContextValue | null {
  return useContext(DemoContext);
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

interface DemoProviderProps {
  children: ReactNode;
  scenario?: string;
  autoPlay?: boolean;
  initialSpeed?: number;
}

export function DemoProvider({ 
  children, 
  scenario = 'growth',
  autoPlay = false,
  initialSpeed = 1,
}: DemoProviderProps) {
  const queryClient = useQueryClient();
  const engineRef = useRef<SimulationEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeedState] = useState(initialSpeed);
  const [tick, setTick] = useState(0);
  
  // Initialize simulation engine and MSW state
  useEffect(() => {
    const scenarioData = getScenario(scenario);
    const engine = createSimulation(scenarioData);
    engineRef.current = engine;
    
    // Initialize MSW state with scenario data
    demoState.agents.set(scenarioData.agents);
    demoState.tasks.set(scenarioData.tasks);
    demoState.credits.set(scenarioData.credits);
    demoState.events.set(scenarioData.events);
    
    // Listen for simulation events
    const unsubscribe = engine.onEvent((event: SimulationEvent) => {
      // Update MSW state based on event type
      switch (event.type) {
        case 'agent_created':
          demoState.agents.add(event.payload as any);
          break;
        case 'agent_promoted':
        case 'agent_terminated':
          const { agent } = event.payload as any;
          demoState.agents.update(agent.id, agent);
          break;
        case 'task_created':
          demoState.tasks.add(event.payload as any);
          break;
        case 'task_assigned':
        case 'task_completed':
          const { task } = event.payload as any;
          demoState.tasks.update(task.id, task);
          break;
        case 'credit_earned':
        case 'credit_spent':
          const { transaction, agent: creditAgent } = event.payload as any;
          demoState.credits.add(transaction);
          demoState.agents.update(creditAgent.id, creditAgent);
          break;
      }
      
      // Invalidate React Query cache to trigger refetch
      queryClient.invalidateQueries();
    });
    
    if (autoPlay) {
      engine.play();
    }
    
    return () => {
      unsubscribe();
      engine.pause();
    };
  }, [scenario, autoPlay, queryClient]);
  
  // Sync speed changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpeed(speed);
    }
  }, [speed]);
  
  // Tick update interval
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      if (engineRef.current) {
        setTick(engineRef.current.getState().currentTick);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const play = useCallback(() => {
    engineRef.current?.play();
    setIsPlaying(true);
  }, []);
  
  const pause = useCallback(() => {
    engineRef.current?.pause();
    setIsPlaying(false);
  }, []);
  
  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
  }, []);
  
  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setTick(0);
      
      // Reinitialize MSW state
      const scenarioData = getScenario(scenario);
      demoState.agents.set(scenarioData.agents);
      demoState.tasks.set(scenarioData.tasks);
      demoState.credits.set(scenarioData.credits);
      demoState.events.set(scenarioData.events);
      
      queryClient.invalidateQueries();
    }
  }, [scenario, queryClient]);
  
  const jumpToTick = useCallback((targetTick: number) => {
    if (engineRef.current) {
      engineRef.current.jumpToTick(targetTick);
      setTick(targetTick);
      
      // Update MSW state from engine
      const state = engineRef.current.getState();
      demoState.agents.set(state.scenario.agents);
      demoState.tasks.set(state.scenario.tasks);
      demoState.credits.set(state.scenario.credits);
      demoState.events.set(state.scenario.events);
      
      queryClient.invalidateQueries();
    }
  }, [queryClient]);
  
  // Get current scenario data from engine
  const getScenarioData = useCallback((): DemoScenario | null => {
    if (!engineRef.current) return null;
    return engineRef.current.getState().scenario;
  }, []);

  const value: DemoContextValue = {
    isDemo: true,
    isPlaying,
    speed,
    tick,
    scenario,
    scenarioData: getScenarioData(),
    play,
    pause,
    setSpeed,
    reset,
    jumpToTick,
  };
  
  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}
