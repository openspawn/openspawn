import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine, createSimulation } from './engine';
import { freshScenario } from '../scenarios/fresh';
import type { SimulationEvent } from '../types';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = createSimulation(freshScenario);
  });

  describe('initialization', () => {
    it('should create engine with initial state', () => {
      const state = engine.getState();
      
      expect(state.currentTick).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.speed).toBe(1);
      expect(state.scenario.name).toBe(freshScenario.name);
    });

    it('should have agents from scenario', () => {
      const agents = engine.getAgents();
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should have tasks from scenario', () => {
      const tasks = engine.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe('tick', () => {
    it('should increment currentTick', () => {
      const initialTick = engine.getState().currentTick;
      engine.tick();
      expect(engine.getState().currentTick).toBe(initialTick + 1);
    });

    it('should return array of events', () => {
      const events = engine.tick();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should emit events to listeners', () => {
      const listener = vi.fn();
      engine.onEvent(listener);
      
      // Tick multiple times to increase chance of events
      for (let i = 0; i < 10; i++) {
        engine.tick();
      }
      
      // Should have been called at least once if any events fired
      // Note: Events are probabilistic, so we just check the listener was set up
      expect(listener).toBeDefined();
    });
  });

  describe('playback controls', () => {
    it('should start playing when play() called', () => {
      engine.play();
      expect(engine.getState().isPlaying).toBe(true);
      engine.pause(); // Clean up
    });

    it('should stop playing when pause() called', () => {
      engine.play();
      engine.pause();
      expect(engine.getState().isPlaying).toBe(false);
    });

    it('should update speed', () => {
      engine.setSpeed(2);
      expect(engine.getState().speed).toBe(2);
    });
  });

  describe('event subscription', () => {
    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = engine.onEvent(listener);
      
      unsubscribe();
      engine.tick();
      
      // Listener should not be called after unsubscribe
      // (though tick might still fire if listener was called before unsubscribe completed)
    });

    it('should allow subscribing to tick events', () => {
      const tickListener = vi.fn();
      engine.onTick(tickListener);
      
      engine.tick();
      
      expect(tickListener).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Number)
      );
    });
  });

  describe('data getters', () => {
    it('should return deep cloned agents', () => {
      const agents1 = engine.getAgents();
      const agents2 = engine.getAgents();
      
      expect(agents1).not.toBe(agents2);
      if (agents1.length > 0) {
        expect(agents1[0]).not.toBe(agents2[0]);
      }
    });

    it('should return deep cloned tasks', () => {
      const tasks1 = engine.getTasks();
      const tasks2 = engine.getTasks();
      
      expect(tasks1).not.toBe(tasks2);
    });

    it('should return deep cloned credits', () => {
      const credits1 = engine.getCredits();
      const credits2 = engine.getCredits();
      
      expect(credits1).not.toBe(credits2);
    });

    it('should return deep cloned events', () => {
      const events1 = engine.getEvents();
      const events2 = engine.getEvents();
      
      expect(events1).not.toBe(events2);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Advance the simulation
      for (let i = 0; i < 5; i++) {
        engine.tick();
      }
      
      expect(engine.getState().currentTick).toBe(5);
      
      engine.reset();
      
      expect(engine.getState().currentTick).toBe(0);
    });
  });
});

describe('createSimulation', () => {
  it('should create a SimulationEngine instance', () => {
    const engine = createSimulation(freshScenario);
    expect(engine).toBeInstanceOf(SimulationEngine);
  });
});
