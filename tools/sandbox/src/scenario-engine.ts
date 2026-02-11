// ── Scenario Engine ──────────────────────────────────────────────────────────
// Wraps DeterministicSimulation with phase management, DAG dependencies,
// random events, resource pools, and scoring.
// The engine hooks into preTick/postTick of the simulation.

import type { DeterministicSimulation } from './deterministic.js';
import type { SandboxTask, SandboxEvent, SandboxAgent } from './types.js';
import type {
  ScenarioDefinition, ScenarioPhase, EpicTemplate, EpicInstance,
  EventTemplate, EventEffect, ResourcePool, ScoreCard, TaskTemplate,
  CompletionCondition, CrossDeptTrigger,
} from './scenario-types.js';
import { SeededRandom, DIFFICULTY_PRESETS } from './scenario-types.js';

let scenarioTaskCounter = 1000;
function nextScenarioTaskId(): string {
  return `TASK-${String(++scenarioTaskCounter).padStart(4, '0')}`;
}

// ── Scenario Engine ──────────────────────────────────────────────────────────

export class ScenarioEngine {
  private sim!: DeterministicSimulation;
  private scenario: ScenarioDefinition;
  private currentPhaseIndex = 0;
  private epics: EpicInstance[] = [];
  private dag: Map<string, string[]> = new Map();  // taskId → dependsOn[]
  private prng: SeededRandom;
  private decisionCount = 0;
  private lastDecisionSnapshot = 0;
  private eventCooldowns: Map<string, number> = new Map();
  private eventOccurrences: Map<string, number> = new Map();
  private eventFrequencyMod = 1.0;
  private resources: ResourcePool[];
  private eventsFired = 0;
  private active = false;

  // Scoring accumulators
  private tasksCompletedCount = 0;
  private reviewRejectCount = 0;
  private reviewTotalCount = 0;
  private blockedTicksTotal = 0;
  private eventRecoveryTicks = 0;
  private deadlineMet = 0;
  private deadlineTotal = 0;

  constructor(scenario: ScenarioDefinition) {
    this.scenario = scenario;
    const seed = scenario.meta.seed === 'random' ? Date.now() : scenario.meta.seed;
    this.prng = new SeededRandom(seed);
    this.resources = scenario.resources.map(r => ({ ...r, current: r.initial }));
  }

  /** Attach to a simulation instance */
  attach(sim: DeterministicSimulation): void {
    this.sim = sim;
    this.active = true;
    this.currentPhaseIndex = 0;
    this.epics = [];
    this.dag.clear();
    this.decisionCount = 0;
    this.lastDecisionSnapshot = 0;
    this.eventCooldowns.clear();
    this.eventOccurrences.clear();
    this.eventsFired = 0;

    // Start Phase 0
    this.enterPhase(0);
    this.log(`🎬 Scenario "${this.scenario.meta.name}" started (${this.scenario.meta.difficulty} difficulty)`);
  }

  get isActive(): boolean { return this.active; }
  get scenarioId(): string { return this.scenario.meta.id; }

  getStatus() {
    const phase = this.scenario.phases[this.currentPhaseIndex];
    return {
      scenarioId: this.scenario.meta.id,
      scenarioName: this.scenario.meta.name,
      currentPhase: phase?.name ?? 'N/A',
      currentPhaseIndex: this.currentPhaseIndex,
      tick: this.sim?.tick ?? 0,
      decisionCount: this.decisionCount,
      resources: this.resources.map(r => ({
        id: r.id, name: r.name,
        current: r.current ?? r.initial,
        initial: r.initial,
        pct: Math.round(((r.current ?? r.initial) / r.initial) * 100),
      })),
      epics: this.epics.map(e => ({
        id: e.id, title: e.title, status: e.status,
        completionPct: Math.round(e.completionPct),
      })),
      scores: this.computeScores(),
      eventsFired: this.eventsFired,
      active: this.active,
    };
  }

  stop(): ScoreCard {
    this.active = false;
    const scores = this.computeScores();
    const overall = this.computeOverall(scores);
    const grade = this.computeGrade(overall);
    return {
      dimensions: scores,
      overall,
      grade: grade.grade,
      gradeLabel: grade.label,
      totalDecisions: this.decisionCount,
      totalTicks: this.sim?.tick ?? 0,
      totalAgents: this.sim?.agents.length ?? 0,
      totalMessages: this.sim?.agents.reduce((s, a) => s + a.stats.messagessSent, 0) ?? 0,
      eventsSurvived: this.eventsFired,
    };
  }

  // ── Pre-tick: inject scenario work ─────────────────────────────────────

  preTick(): void {
    if (!this.active) return;

    // 1. Evaluate phase transitions
    this.evaluatePhaseTransition();

    // 2. Update epic completion percentages
    this.updateEpicCompletion();

    // 3. Expand newly unlocked epics into tasks
    this.expandUnlockedEpics();

    // 4. Resolve DAG — unblock tasks whose dependencies are met
    this.resolveDAG();

    // 5. Fire random events
    this.fireEvents();

    // 6. Update resource pools
    this.updateResources();
  }

  // ── Post-tick: count decisions, handle triggers ────────────────────────

  postTick(): void {
    if (!this.active) return;

    // Count new decisions (agent actions this tick)
    this.countDecisions();

    // Check for completed tasks that have cross-dept triggers
    this.processTriggers();

    // Calibrate pacing
    this.calibratePacing();

    // Check scenario end
    if (this.currentPhaseIndex >= this.scenario.phases.length) {
      this.log('🏁 Scenario complete!');
      this.active = false;
    }
  }

  // ── Phase Management ───────────────────────────────────────────────────

  private enterPhase(index: number): void {
    if (index >= this.scenario.phases.length) {
      this.currentPhaseIndex = this.scenario.phases.length; // marks end
      return;
    }
    this.currentPhaseIndex = index;
    const phase = this.scenario.phases[index];
    this.log(`\n🔶 PHASE ${index + 1}: ${phase.name}`);
    this.log(`   ${phase.narrative}`);

    // Emit phase change event
    this.emitEvent({
      type: 'phase_change',
      message: `Phase ${index + 1}: ${phase.name} — ${phase.narrative}`,
      timestamp: Date.now(),
    });

    // Mark epics for this phase as ready to expand
    for (const epicId of phase.unlocksEpics) {
      const existing = this.epics.find(e => e.templateId === epicId);
      if (!existing) {
        const template = this.scenario.epics.find(e => e.id === epicId);
        if (template) {
          this.epics.push({
            id: `epic-${epicId}-${this.sim.tick}`,
            templateId: epicId,
            title: template.title,
            phase: template.phase,
            domains: template.domains,
            priority: template.priority,
            status: 'active',
            taskIds: [],
            completionPct: 0,
            unlockedAtTick: this.sim.tick,
          });
        }
      }
    }
  }

  private evaluatePhaseTransition(): void {
    const phase = this.scenario.phases[this.currentPhaseIndex];
    if (!phase) return;

    const tick = this.sim.tick;
    const transition = phase.transition;
    let shouldTransition = false;

    switch (transition.type) {
      case 'tick':
        shouldTransition = tick >= transition.tick;
        break;
      case 'completion':
        shouldTransition = this.checkCompletion(transition.condition);
        break;
      case 'hybrid':
        shouldTransition = tick >= transition.tick || this.checkCompletion(transition.condition);
        break;
    }

    // Also transition if we exceed the tick range
    if (tick > phase.tickRange[1]) {
      shouldTransition = true;
    }

    if (shouldTransition) {
      this.enterPhase(this.currentPhaseIndex + 1);
    }
  }

  private checkCompletion(condition: CompletionCondition): boolean {
    const activeEpics = this.epics.filter(e => e.status !== 'locked');

    if (condition.epicsDone !== undefined) {
      const doneCount = activeEpics.filter(e => e.status === 'done').length;
      return doneCount >= condition.epicsDone;
    }

    if (condition.epicCompletionPct !== undefined) {
      return activeEpics.every(e => e.completionPct >= condition.epicCompletionPct!);
    }

    if (condition.specificEpics) {
      return condition.specificEpics.every(id => {
        const epic = this.epics.find(e => e.templateId === id);
        return epic && (epic.status === 'done' || epic.completionPct >= 100);
      });
    }

    return false;
  }

  // ── Epic Expansion ─────────────────────────────────────────────────────

  private expandUnlockedEpics(): void {
    for (const epic of this.epics) {
      if (epic.status !== 'active' || epic.taskIds.length > 0) continue;

      // Check epic-level dependencies
      const template = this.scenario.epics.find(e => e.id === epic.templateId);
      if (template?.dependsOnEpics) {
        const allDone = template.dependsOnEpics.every(depId => {
          const dep = this.epics.find(e => e.templateId === depId);
          return dep && dep.status === 'done';
        });
        if (!allDone) continue;
      }

      this.expandEpic(epic, template!);
    }
  }

  private expandEpic(epic: EpicInstance, template: EpicTemplate): void {
    this.log(`📦 Expanding epic: ${epic.title}`);

    const taskIdMap: Map<string, string> = new Map(); // templateId → actual taskId

    for (const taskTpl of template.taskTemplates) {
      const taskId = nextScenarioTaskId();
      taskIdMap.set(taskTpl.id, taskId);

      // Create main task
      const task: SandboxTask = {
        id: taskId,
        title: taskTpl.title,
        description: `[${epic.title}] ${taskTpl.title}`,
        priority: template.priority,
        status: 'backlog',
        creatorId: this.findLeadForDomain(taskTpl.domain)?.id ?? 'scenario-engine',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activityLog: [],
        acked: false,
        epicId: epic.id,
      };

      // Handle dependencies within the epic
      if (taskTpl.dependsOnTasks && taskTpl.dependsOnTasks.length > 0) {
        const deps: string[] = [];
        for (const depTemplateId of taskTpl.dependsOnTasks) {
          const depTaskId = taskIdMap.get(depTemplateId);
          if (depTaskId) deps.push(depTaskId);
        }
        if (deps.length > 0) {
          (task as any).dependsOn = deps;
          task.status = 'blocked';
          task.blockedReason = 'Dependency not ready';
          this.dag.set(taskId, deps);
        }
      }

      this.sim.tasks.push(task);
      epic.taskIds.push(taskId);

      // Create subtasks
      for (const subtaskTpl of taskTpl.subtasks) {
        const subtaskId = nextScenarioTaskId();
        const duration = this.prng.int(subtaskTpl.durationRange[0], subtaskTpl.durationRange[1]);
        const subtask: SandboxTask = {
          id: subtaskId,
          title: subtaskTpl.title,
          description: `Subtask of "${taskTpl.title}": ${subtaskTpl.title}`,
          priority: template.priority,
          status: 'backlog',
          creatorId: task.creatorId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          activityLog: [],
          acked: false,
          epicId: epic.id,
          parentTaskId: taskId,
        };

        // Store duration hint for the simulation
        (subtask as any)._targetDuration = duration;
        (subtask as any)._stageTickCount = 0;

        this.sim.tasks.push(subtask);
        if (!(task as any).subtaskIds) (task as any).subtaskIds = [];
        (task as any).subtaskIds.push(subtaskId);
        epic.taskIds.push(subtaskId);
      }

      // Store trigger info on the task for postTick processing
      if (taskTpl.crossDeptTriggers) {
        (task as any)._crossDeptTriggers = taskTpl.crossDeptTriggers;
      }

      // Store resource cost
      if (taskTpl.resourceCost) {
        (task as any)._resourceCost = taskTpl.resourceCost;
      }
    }

    // Auto-assign backlog tasks to appropriate leads
    this.assignBacklogTasks();
  }

  private assignBacklogTasks(): void {
    // Pass 1: Assign parent tasks to leads first
    for (const task of this.sim.tasks) {
      if (task.status !== 'backlog' || task.assigneeId) continue;
      if ((task as any).parentTaskId) continue; // skip subtasks in pass 1

      const epicId = (task as any).epicId;
      if (!epicId) continue;

      const domain = this.getDomainFromTask(task);
      const lead = this.findLeadForDomain(domain);
      if (lead) {
        task.assigneeId = lead.id;
        const hasSubtasks = (task as any).subtaskIds && (task as any).subtaskIds.length > 0;
        task.status = hasSubtasks ? 'in_progress' : 'assigned';
        lead.taskIds.push(task.id);
        this.decisionCount++;
      }
    }

    // Pass 2: Assign subtasks to the lead who owns the parent
    for (const task of this.sim.tasks) {
      if (task.status !== 'backlog' || task.assigneeId) continue;
      if (!(task as any).parentTaskId) continue; // only subtasks in pass 2

      const parent = this.sim.tasks.find(t => t.id === (task as any).parentTaskId);
      let lead: SandboxAgent | undefined;

      if (parent?.assigneeId) {
        const parentAssignee = this.sim.agents.find(a => a.id === parent.assigneeId);
        lead = parentAssignee && (parentAssignee.role === 'lead' || parentAssignee.level >= 7)
          ? parentAssignee
          : this.sim.agents.find(a => a.id === parentAssignee?.parentId && (a.role === 'lead' || a.level >= 7));
      }

      // Fallback: find lead by domain from the task description
      if (!lead) {
        const domain = this.getDomainFromTask(task);
        lead = this.findLeadForDomain(domain);
      }

      if (lead) {
        task.assigneeId = lead.id;
        task.status = 'assigned';
        lead.taskIds.push(task.id);
        this.decisionCount++;
      }
    }
  }

  private getDomainFromTask(task: SandboxTask): string {
    // Try to extract domain from description brackets
    const match = task.description.match(/\[([^\]]+)\]/);
    return match ? match[1].toLowerCase() : 'engineering';
  }

  private findLeadForDomain(domain: string): SandboxAgent | undefined {
    const d = domain.toLowerCase();
    return this.sim.agents.find(a =>
      (a.role === 'lead' || a.level >= 7) &&
      a.domain.toLowerCase().includes(d)
    ) || this.sim.agents.find(a =>
      a.role === 'lead'
    );
  }

  // ── DAG Resolution ─────────────────────────────────────────────────────

  private resolveDAG(): void {
    for (const [taskId, deps] of this.dag.entries()) {
      const task = this.sim.tasks.find(t => t.id === taskId);
      if (!task || task.status !== 'blocked') continue;
      if (task.blockedReason !== 'Dependency not ready') continue;

      const allMet = deps.every(depId => {
        const dep = this.sim.tasks.find(t => t.id === depId);
        return dep && dep.status === 'done';
      });

      if (allMet) {
        task.status = 'backlog';
        task.blockedReason = undefined;
        (task as any).dependsOn = undefined;
        this.dag.delete(taskId);
        this.log(`🔓 Unblocked "${task.title}" (dependencies met)`);
        this.decisionCount++; // unblock = 1 decision
      }
    }
  }

  // ── Event Scheduling ───────────────────────────────────────────────────

  private fireEvents(): void {
    const phase = this.scenario.phases[this.currentPhaseIndex];
    if (!phase) return;

    const tick = this.sim.tick;
    const difficultyPreset = DIFFICULTY_PRESETS[this.scenario.meta.difficulty];

    for (const eventId of phase.enabledEvents) {
      const template = this.scenario.events.find(e => e.id === eventId);
      if (!template) continue;

      // Check cooldown
      const lastFired = this.eventCooldowns.get(eventId) ?? -Infinity;
      if (tick - lastFired < template.cooldownTicks) continue;

      // Check max occurrences
      const occurrences = this.eventOccurrences.get(eventId) ?? 0;
      if (template.maxOccurrences !== undefined && occurrences >= template.maxOccurrences) continue;

      // Roll probability
      const adjustedProb = template.probability
        * phase.difficultyMod
        * difficultyPreset.eventFrequencyMod
        * this.eventFrequencyMod;

      if (this.prng.chance(adjustedProb)) {
        this.executeEvent(template);
        this.eventCooldowns.set(eventId, tick);
        this.eventOccurrences.set(eventId, occurrences + 1);
        this.eventsFired++;
      }
    }
  }

  private executeEvent(template: EventTemplate): void {
    this.log(`\n🎲 EVENT: ${template.name}`);
    this.log(`   ${template.narrative}`);

    this.emitEvent({
      type: 'scenario_event',
      message: `${template.narrative}`,
      data: { eventId: template.id, eventType: template.type },
      timestamp: Date.now(),
    });

    const effect = template.effect;

    // Create tasks from event
    if (effect.createTasks) {
      for (const taskDef of effect.createTasks) {
        const taskId = nextScenarioTaskId();
        const task: SandboxTask = {
          id: taskId,
          title: taskDef.title,
          description: `[Event: ${template.name}] ${taskDef.title}`,
          priority: taskDef.priority,
          status: 'backlog',
          creatorId: 'scenario-engine',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          activityLog: [],
          acked: false,
        };
        this.sim.tasks.push(task);

        // Create subtasks
        for (let i = 0; i < taskDef.subtaskCount; i++) {
          const subId = nextScenarioTaskId();
          const sub: SandboxTask = {
            id: subId,
            title: `${taskDef.title} — step ${i + 1}`,
            description: `Subtask ${i + 1} of event task "${taskDef.title}"`,
            priority: taskDef.priority,
            status: 'backlog',
            creatorId: 'scenario-engine',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activityLog: [],
            acked: false,
            parentTaskId: taskId,
          };
          const dur = this.prng.int(taskDef.durationRange[0], taskDef.durationRange[1]);
          (sub as any)._targetDuration = dur;
          this.sim.tasks.push(sub);
        }

        this.decisionCount += 2; // event response decisions
      }
    }

    // Block agents
    if (effect.blockAgents) {
      const candidates = this.sim.agents.filter(a => {
        if (effect.blockAgents!.domain && !a.domain.toLowerCase().includes(effect.blockAgents!.domain)) return false;
        if (effect.blockAgents!.role && a.role !== effect.blockAgents!.role) return false;
        return a.role !== 'coo';
      });
      const count = effect.blockAgents.count ?? 1;
      for (let i = 0; i < Math.min(count, candidates.length); i++) {
        const agent = this.prng.pick(candidates);
        // Block their current tasks
        for (const taskId of agent.taskIds) {
          const task = this.sim.tasks.find(t => t.id === taskId);
          if (task && !['done', 'rejected'].includes(task.status)) {
            task.status = 'blocked';
            task.blockedReason = `Agent ${agent.name} unavailable (${template.name})`;
          }
        }
        this.log(`   ⚠️ ${agent.name} affected by ${template.name}`);
      }
    }

    // Resource effects
    if (effect.resourceEffect) {
      for (const [resId, amount] of Object.entries(effect.resourceEffect)) {
        const pool = this.resources.find(r => r.id === resId);
        if (pool) {
          pool.current = (pool.current ?? pool.initial) + amount;
          if (pool.current < 0) pool.current = 0;
        }
      }
    }

    // Elevate priorities
    if (effect.elevatePriority) {
      const inProgress = this.sim.tasks.filter(t => t.status === 'in_progress');
      for (let i = 0; i < Math.min(effect.elevatePriority, inProgress.length); i++) {
        const task = this.prng.pick(inProgress);
        task.priority = 'critical';
        this.log(`   ⬆️ "${task.title}" elevated to critical`);
      }
    }

    // Expand epic
    if (effect.expandEpic) {
      const activeEpics = this.epics.filter(e => e.status === 'active');
      if (activeEpics.length > 0) {
        const epic = this.prng.pick(activeEpics);
        for (let i = 0; i < effect.expandEpic.taskCount; i++) {
          const taskId = nextScenarioTaskId();
          const task: SandboxTask = {
            id: taskId,
            title: `Scope addition ${i + 1} for ${epic.title}`,
            description: `Added by ${template.name}`,
            priority: effect.expandEpic.priority,
            status: 'backlog',
            creatorId: 'scenario-engine',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activityLog: [],
            acked: false,
            epicId: epic.id,
          };
          this.sim.tasks.push(task);
          epic.taskIds.push(taskId);
        }
        this.log(`   📋 Added ${effect.expandEpic.taskCount} tasks to "${epic.title}"`);
      }
    }
  }

  // ── Resource Management ────────────────────────────────────────────────

  private updateResources(): void {
    const activeTasks = this.sim.tasks.filter(t =>
      ['in_progress', 'assigned', 'review'].includes(t.status)
    ).length;

    for (const pool of this.resources) {
      if (pool.burnRate > 0 && activeTasks > 0) {
        pool.current = (pool.current ?? pool.initial) - pool.burnRate;
        if (pool.current < 0) pool.current = 0;
      }

      const pct = (pool.current ?? pool.initial) / pool.initial;
      if (pct <= pool.alertThresholdPct / 100 && pct > 0) {
        // Only alert once per 20 ticks
        if (this.sim.tick % 20 === 0) {
          this.log(`⚠️ Resource "${pool.name}" at ${Math.round(pct * 100)}%`);
        }
      }

      // Handle depletion
      if (pool.current !== undefined && pool.current <= 0 && pool.depletedEffect === 'pause-non-critical') {
        for (const task of this.sim.tasks) {
          if (task.priority !== 'critical' && task.status === 'in_progress') {
            task.status = 'blocked';
            task.blockedReason = `Resource depleted: ${pool.name}`;
          }
        }
      }
    }
  }

  // ── Decision Counting ──────────────────────────────────────────────────

  private countDecisions(): void {
    // Count based on total messages sent (each message ≈ 1 decision)
    const totalMessages = this.sim.agents.reduce((s, a) => s + a.stats.messagessSent, 0);
    const newDecisions = totalMessages - this.lastDecisionSnapshot;
    this.decisionCount += Math.max(0, newDecisions);
    this.lastDecisionSnapshot = totalMessages;

    // Also count task state changes
    const completedNow = this.sim.tasks.filter(t => t.status === 'done').length;
    if (completedNow > this.tasksCompletedCount) {
      this.decisionCount += (completedNow - this.tasksCompletedCount);
      this.tasksCompletedCount = completedNow;
    }
  }

  private calibratePacing(): void {
    const totalTicks = this.scenario.meta.totalTicks;
    const targetRate = this.scenario.meta.targetDecisions / totalTicks;
    const currentTick = this.sim.tick;
    if (currentTick < 10) return; // too early to calibrate

    const actualRate = this.decisionCount / currentTick;
    if (actualRate < targetRate * 0.7) {
      this.eventFrequencyMod = Math.min(2.0, this.eventFrequencyMod * 1.05);
    } else if (actualRate > targetRate * 1.3) {
      this.eventFrequencyMod = Math.max(0.3, this.eventFrequencyMod * 0.95);
    }
  }

  // ── Cross-Department Triggers ──────────────────────────────────────────

  private processTriggers(): void {
    for (const task of this.sim.tasks) {
      if (task.status !== 'done') continue;
      const triggers = (task as any)._crossDeptTriggers as CrossDeptTrigger[] | undefined;
      if (!triggers || (task as any)._triggersProcessed) continue;

      for (const trigger of triggers) {
        if (trigger.action === 'create_task') {
          const taskId = nextScenarioTaskId();
          const newTask: SandboxTask = {
            id: taskId,
            title: trigger.target,
            description: `Triggered by completion of "${task.title}"`,
            priority: trigger.priority ?? 'high',
            status: 'backlog',
            creatorId: task.creatorId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activityLog: [],
            acked: false,
          };
          this.sim.tasks.push(newTask);
          this.log(`   🔗 Trigger: created "${trigger.target}" (from "${task.title}")`);
          this.decisionCount += 2;
        } else if (trigger.action === 'unlock_epic') {
          const epic = this.epics.find(e => e.templateId === trigger.target);
          if (epic && epic.status === 'locked') {
            epic.status = 'active';
            epic.unlockedAtTick = this.sim.tick;
            this.log(`   🔓 Trigger: unlocked epic "${epic.title}"`);
          }
        }
      }
      (task as any)._triggersProcessed = true;
    }
  }

  // ── Epic Completion Tracking ───────────────────────────────────────────

  private updateEpicCompletion(): void {
    for (const epic of this.epics) {
      if (epic.status !== 'active') continue;
      if (epic.taskIds.length === 0) continue;

      const tasks = epic.taskIds.map(id => this.sim.tasks.find(t => t.id === id)).filter(Boolean) as SandboxTask[];
      const done = tasks.filter(t => t.status === 'done').length;
      epic.completionPct = (done / tasks.length) * 100;

      if (epic.completionPct >= 100) {
        epic.status = 'done';
        epic.completedAtTick = this.sim.tick;
        this.log(`🎉 Epic complete: ${epic.title}`);
        this.decisionCount += 3; // epic completion decisions
      }
    }
  }

  // ── Scoring ────────────────────────────────────────────────────────────

  private computeScores(): Record<string, number> {
    const tick = this.sim?.tick ?? 1;
    const tasks = this.sim?.tasks ?? [];
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = Math.max(1, tasks.length);
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    // Velocity: tasks completed per tick, normalized to 0-100
    const velocity = Math.min(100, (doneTasks / Math.max(1, tick)) * 200);

    // Quality: inverse of block/reject rate
    const quality = Math.max(0, 100 - (blockedTasks / totalTasks) * 200);

    // Efficiency: resource remaining ratio
    const totalResourcePct = this.resources.reduce((sum, r) => {
      return sum + ((r.current ?? r.initial) / r.initial);
    }, 0) / Math.max(1, this.resources.length);
    const efficiency = Math.round(totalResourcePct * 100);

    // Resilience: how quickly events were recovered from (approximation)
    const resilience = Math.max(0, 100 - this.eventsFired * 5);

    // Morale: based on block time and agent utilization
    const busyAgents = (this.sim?.agents ?? []).filter(a => a.status === 'busy' || a.taskIds.length > 0).length;
    const totalAgents = Math.max(1, (this.sim?.agents ?? []).length);
    const morale = Math.min(100, (busyAgents / totalAgents) * 100 + 20);

    // Deadline: completion percentage
    const deadline = Math.min(100, (doneTasks / totalTasks) * 100);

    return { velocity, quality, efficiency, resilience, morale, deadline };
  }

  private computeOverall(scores: Record<string, number>): number {
    const weights = this.scenario.scoring.weights;
    let total = 0;
    let weightSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += (scores[key] ?? 0) * weight;
      weightSum += weight;
    }
    return Math.round(total / Math.max(1, weightSum));
  }

  private computeGrade(overall: number): { grade: string; label: string } {
    for (const g of this.scenario.scoring.grades) {
      if (overall >= g.minScore) return { grade: g.grade, label: g.label };
    }
    return { grade: 'F', label: 'Total organizational collapse.' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private log(msg: string): void {
    const event: SandboxEvent = { type: 'system', message: msg, timestamp: Date.now() };
    if (this.sim) {
      this.sim.events.push(event);
    }
    console.log(msg);
  }

  private emitEvent(event: SandboxEvent): void {
    if (this.sim) {
      this.sim.events.push(event);
    }
  }
}
