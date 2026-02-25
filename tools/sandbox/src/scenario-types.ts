// ── Scenario Engine Types ────────────────────────────────────────────────────
// TypeScript interfaces for the BikiniBottom Scenario Engine.
// Scenarios are defined as typed TS objects, NOT parsed from markdown.

import type { SandboxTask } from './types.js';

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] (inclusive) */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Returns true with given probability */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Weighted random selection. weights[i] is relative weight for index i. Returns index. */
  weighted(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return weights.length - 1;
  }
}

// ── Scenario Definition ──────────────────────────────────────────────────────

export interface ScenarioDefinition {
  meta: ScenarioMeta;
  phases: ScenarioPhase[];
  epics: EpicTemplate[];
  events: EventTemplate[];
  resources: ResourcePool[];
  scoring: ScoringConfig;
}

export interface ScenarioMeta {
  id: string;
  name: string;
  industry: string;
  description: string;
  duration: string;            // e.g. "20 minutes"
  targetDecisions: number;
  tickIntervalMs: number;
  seed: number | 'random';
  difficulty: Difficulty;
  totalTicks: number;          // estimated total ticks for the scenario
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'chaos';

export const DIFFICULTY_PRESETS: Record<Difficulty, {
  eventFrequencyMod: number;
  reviewRejectPct: number;
  resourceScarcity: number;   // 0 = none, 1 = extreme
  blockChance: number;
}> = {
  easy:   { eventFrequencyMod: 0.5,  reviewRejectPct: 0.05, resourceScarcity: 0,   blockChance: 0.05 },
  normal: { eventFrequencyMod: 1.0,  reviewRejectPct: 0.15, resourceScarcity: 0.2, blockChance: 0.10 },
  hard:   { eventFrequencyMod: 1.5,  reviewRejectPct: 0.25, resourceScarcity: 0.5, blockChance: 0.20 },
  chaos:  { eventFrequencyMod: 2.5,  reviewRejectPct: 0.35, resourceScarcity: 0.8, blockChance: 0.30 },
};

// ── Phases ───────────────────────────────────────────────────────────────────

export interface ScenarioPhase {
  id: string;
  name: string;
  tickRange: [number, number];
  tickIntervalMs?: number;
  unlocksEpics: string[];       // epic IDs to unlock when phase starts
  enabledEvents: string[];      // event IDs active during this phase
  difficultyMod: number;        // multiplier on event probability (1.0 = normal)
  transition: PhaseTransition;
  narrative: string;            // displayed on phase start
}

export type PhaseTransition =
  | { type: 'tick'; tick: number }
  | { type: 'completion'; condition: CompletionCondition }
  | { type: 'hybrid'; tick: number; condition: CompletionCondition };

export interface CompletionCondition {
  /** e.g. "epicsDone >= 3" or "epicCompletion >= 0.6" */
  epicsDone?: number;
  epicCompletionPct?: number;   // all unlocked epics at this % or higher
  specificEpics?: string[];     // these specific epics must be done/at threshold
}

// ── Epics ────────────────────────────────────────────────────────────────────

export interface EpicTemplate {
  id: string;
  title: string;
  phase: string;               // phase ID that unlocks this epic
  domains: string[];
  priority: SandboxTask['priority'];
  description: string;
  taskTemplates: TaskTemplate[];
  dependsOnEpics?: string[];   // other epic IDs that must be done first
}

export interface TaskTemplate {
  id: string;
  title: string;
  domain: string;
  subtasks: SubtaskTemplate[];
  durationRange: [number, number];  // ticks per subtask [min, max]
  reviewRequired: boolean;
  reviewLoop?: {
    maxIterations: number;
    weights: number[];             // [pass, minor-revise, major-revise, escalate]
  };
  dependsOnTasks?: string[];      // task template IDs within the same epic
  crossDeptTriggers?: CrossDeptTrigger[];
  resourceCost?: Record<string, number>;
}

export interface SubtaskTemplate {
  title: string;
  durationRange: [number, number];
}

export interface CrossDeptTrigger {
  action: 'create_task' | 'unlock_epic' | 'notify';
  target: string;               // task title, epic ID, or agent role
  domain?: string;
  priority?: SandboxTask['priority'];
}

// ── Events ───────────────────────────────────────────────────────────────────

export type EventType = 'interrupt' | 'disruption' | 'expansion' | 'modifier' | 'narrative' | 'opportunity';

export interface EventTemplate {
  id: string;
  name: string;
  type: EventType;
  probability: number;          // per-tick probability when enabled
  cooldownTicks: number;
  maxOccurrences?: number;      // limit total fires (e.g. 1 = fires once)
  durationTicks?: number;       // how long the event effect lasts
  narrative: string;
  effect: EventEffect;
}

export interface EventEffect {
  /** Create new tasks */
  createTasks?: Array<{
    title: string;
    domain: string;
    priority: SandboxTask['priority'];
    subtaskCount: number;
    durationRange: [number, number];
  }>;
  /** Block specific agents or domains for N ticks */
  blockAgents?: {
    count?: number;
    domain?: string;
    role?: string;
    durationTicks: number;
  };
  /** Modify resource pools */
  resourceEffect?: Record<string, number>;  // positive = add, negative = subtract
  /** Elevate priority of random in-progress tasks */
  elevatePriority?: number;     // number of tasks to elevate
  /** Add tasks to a random in-progress epic */
  expandEpic?: {
    taskCount: number;
    domain: string;
    priority: SandboxTask['priority'];
  };
}

// ── Resources ────────────────────────────────────────────────────────────────

export type ResourceType = 'agent-hours' | 'calendar' | 'credits' | 'compute';

export interface ResourcePool {
  id: string;
  name: string;
  type: ResourceType;
  initial: number;
  current?: number;            // runtime state
  burnRate: number;            // per-tick consumption during active work
  alertThresholdPct: number;   // fire alert event when below this %
  depletedEffect: 'pause-non-critical' | 'pause-all' | 'none';
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoringConfig {
  dimensions: ScoringDimension[];
  weights: Record<string, number>;
  grades: GradeThreshold[];
}

export interface ScoringDimension {
  id: string;
  name: string;
  description: string;
}

export interface GradeThreshold {
  grade: string;
  minScore: number;
  label: string;
}

export interface ScoreCard {
  dimensions: Record<string, number>;   // dimension id → score 0-100
  overall: number;
  grade: string;
  gradeLabel: string;
  totalDecisions: number;
  totalTicks: number;
  totalAgents: number;
  totalMessages: number;
  eventsSurvived: number;
}

// ── Decision Types ───────────────────────────────────────────────────────────

export type DecisionType =
  | 'command'         // delegate, approve plan, allocate
  | 'execution'       // start work, progress, submit
  | 'review'          // approve, reject, request changes
  | 'communication'   // ack, progress report, escalation
  | 'hiring'          // spawn agent, assign, first task
  | 'contention'      // resource conflict, priority override
  | 'event_response'  // triage, reassign, emergency
  | 'strategic';      // phase transition, scope cut

// ── Runtime State ────────────────────────────────────────────────────────────

export interface EpicInstance {
  id: string;
  templateId: string;
  title: string;
  phase: string;
  domains: string[];
  priority: SandboxTask['priority'];
  status: 'locked' | 'active' | 'done';
  taskIds: string[];
  completionPct: number;
  unlockedAtTick?: number;
  completedAtTick?: number;
}

export interface ScenarioState {
  scenarioId: string;
  currentPhaseIndex: number;
  tick: number;
  decisionCount: number;
  epics: EpicInstance[];
  resources: ResourcePool[];
  scores: Record<string, number>;
  eventsFired: number;
  active: boolean;
}
