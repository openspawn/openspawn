import type { 
  DemoScenario, 
  SimulationState, 
  SimulationEvent,
  DemoAgent,
  DemoTask,
  DemoCreditTransaction,
  DemoEvent,
  DemoMessage,
  TaskStatus,
  AgentStatus,
} from '../types.js';
import { generateRandomAgent, generateRandomTask, generateCreditTransaction, generateEvent, generateMessage } from '../fixtures/index.js';

// Probability distributions for different events (per tick)
const PROBABILITIES = {
  // Agent events
  agentCreated: 0.12,      // 12% chance per tick
  agentActivated: 0.35,    // 35% chance parent activates a pending child
  agentPromoted: 0.05,     // 5% chance per tick
  agentStatusChange: 0.03, // 3% chance per tick (paused/suspended)
  agentDespawned: 0.04,    // 4% chance per tick - agents can be terminated
  
  // Task events
  taskCreated: 0.18,       // 18% chance per tick
  taskStatusChange: 0.45,  // 45% chance per tick - faster task flow
  taskBatchAdvance: 0.20,  // 20% chance to advance multiple tasks at once
  
  // Credit events
  creditEarned: 0.15,      // 15% chance per tick
  creditSpent: 0.18,       // 18% chance per tick
  
  // Message events
  messageSent: 0.40,       // 40% chance per tick - agents chat frequently
  messageBurst: 0.15,      // 15% chance of multiple messages at once
  
  // System events
  systemEvent: 0.05,       // 5% chance per tick
};

// Capacity limits by level (how many active children a parent can manage)
const CAPACITY_BY_LEVEL: Record<number, number> = {
  10: 5,   // COO - manages up to 5 direct reports
  9: 8,    // HR - manages up to 8 agents
  8: 6,    // Senior Manager
  7: 5,    // Manager
  6: 3,    // Senior - limited management
  5: 2,    // Can mentor 1-2
  4: 1,    // Worker - rarely manages
  3: 0,
  2: 0,
  1: 0,
};

// Task status flow
const TASK_STATUS_FLOW: Record<TaskStatus, TaskStatus | null> = {
  backlog: 'pending',
  pending: 'assigned',
  assigned: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: null,
  cancelled: null,
};

// Helper to generate UUIDs
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Check if event should fire based on probability
function shouldFire(probability: number): boolean {
  return Math.random() < probability;
}

export class SimulationEngine {
  private state: SimulationState;
  private listeners: ((event: SimulationEvent) => void)[] = [];
  private tickListeners: ((events: SimulationEvent[], tick: number) => void)[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(scenario: DemoScenario) {
    this.state = {
      currentTick: 0,
      speed: 1,
      isPlaying: false,
      scenario: this.deepClone(scenario),
      startTime: new Date(),
      simulatedTime: new Date(),
    };
    
    // Add initial "system started" event if scenario has no events
    if (this.state.scenario.events.length === 0) {
      const startEvent = generateEvent(
        'system.started',
        'info',
        `Simulation started with ${this.state.scenario.agents.length} agent(s)`,
        { metadata: { scenarioName: scenario.name } }
      );
      this.state.scenario.events.push(startEvent);
    }
  }
  
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // Event listener management
  onEvent(callback: (event: SimulationEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  // Tick listener - fires once per tick with all events from that tick
  onTick(callback: (events: SimulationEvent[], tick: number) => void): () => void {
    this.tickListeners.push(callback);
    return () => {
      this.tickListeners = this.tickListeners.filter(l => l !== callback);
    };
  }
  
  private emit(event: SimulationEvent): void {
    this.listeners.forEach(l => l(event));
  }
  
  private emitTick(events: SimulationEvent[], tick: number): void {
    this.tickListeners.forEach(l => l(events, tick));
  }
  
  // State getters
  getState(): SimulationState {
    return this.deepClone(this.state);
  }
  
  getAgents(): DemoAgent[] {
    return this.deepClone(this.state.scenario.agents);
  }
  
  getTasks(): DemoTask[] {
    return this.deepClone(this.state.scenario.tasks);
  }
  
  getCredits(): DemoCreditTransaction[] {
    return this.deepClone(this.state.scenario.credits);
  }
  
  getEvents(): DemoEvent[] {
    return this.deepClone(this.state.scenario.events);
  }
  
  getMessages(): DemoMessage[] {
    return this.deepClone(this.state.scenario.messages || []);
  }
  
  // Playback controls
  play(): void {
    if (this.state.isPlaying) return;
    
    this.state.isPlaying = true;
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this.state.speed);
  }
  
  pause(): void {
    this.state.isPlaying = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  setSpeed(speed: number): void {
    this.state.speed = speed;
    if (this.state.isPlaying) {
      this.pause();
      this.play();
    }
  }
  
  jumpToTick(tick: number): void {
    const currentTick = this.state.currentTick;
    if (tick > currentTick) {
      // Fast forward
      for (let i = currentTick; i < tick; i++) {
        this.tick(false); // Don't emit events during fast forward
      }
    }
    // Note: Rewinding would require state snapshots - not implemented
  }
  
  reset(): void {
    this.pause();
    this.state.currentTick = 0;
    this.state.simulatedTime = new Date();
  }
  
  // Main simulation tick
  tick(emitEvents: boolean = true): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const now = new Date();
    
    this.state.currentTick++;
    this.state.simulatedTime = new Date(
      this.state.startTime.getTime() + this.state.currentTick * 60 * 60 * 1000 // 1 tick = 1 simulated hour
    );
    
    // Process random events based on probabilities
    
    // Agent created
    if (shouldFire(PROBABILITIES.agentCreated)) {
      const event = this.createAgent();
      if (event) events.push(event);
    }
    
    // Parent activates pending child (realistic onboarding flow)
    if (shouldFire(PROBABILITIES.agentActivated)) {
      const event = this.activatePendingAgent();
      if (event) events.push(event);
    }
    
    // Agent promoted
    if (shouldFire(PROBABILITIES.agentPromoted)) {
      const event = this.promoteAgent();
      if (event) events.push(event);
    }
    
    // Agent status change (pause/suspend - rare)
    if (shouldFire(PROBABILITIES.agentStatusChange)) {
      const event = this.changeAgentStatus();
      if (event) events.push(event);
    }
    
    // Agent despawned (terminated or suspended)
    if (shouldFire(PROBABILITIES.agentDespawned)) {
      const event = this.despawnAgent();
      if (event) events.push(event);
    }
    
    // Task created
    if (shouldFire(PROBABILITIES.taskCreated)) {
      const event = this.createTask();
      if (event) events.push(event);
    }
    
    // Task status change (single task)
    if (shouldFire(PROBABILITIES.taskStatusChange)) {
      const event = this.advanceTask();
      if (event) events.push(event);
    }
    
    // Batch advance (multiple tasks at once - simulates work sprints)
    if (shouldFire(PROBABILITIES.taskBatchAdvance)) {
      const batchEvents = this.batchAdvanceTasks();
      events.push(...batchEvents);
    }
    
    // Credit earned
    if (shouldFire(PROBABILITIES.creditEarned)) {
      const event = this.earnCredits();
      if (event) events.push(event);
    }
    
    // Credit spent
    if (shouldFire(PROBABILITIES.creditSpent)) {
      const event = this.spendCredits();
      if (event) events.push(event);
    }
    
    // Message sent
    if (shouldFire(PROBABILITIES.messageSent)) {
      const event = this.sendMessage();
      if (event) events.push(event);
    }
    
    // Message burst (multiple messages at once - simulates active discussion)
    if (shouldFire(PROBABILITIES.messageBurst)) {
      const burstEvents = this.burstMessages();
      events.push(...burstEvents);
    }
    
    // Emit all events
    if (emitEvents) {
      events.forEach(e => this.emit(e));
      // Emit tick callback with all events from this tick
      this.emitTick(events, this.state.currentTick);
    }
    
    return events;
  }
  
  // Event generators
  private createAgent(): SimulationEvent | null {
    // Higher level agents can spawn new agents (L7+ can spawn, L9+ preferred)
    const activeAgents = this.state.scenario.agents.filter(a => a.status === 'active' && a.level >= 7);
    if (activeAgents.length === 0) return null;
    
    const parent = randomFrom(activeAgents);
    
    // New agents start at level 1-3 depending on parent level
    const startLevel = parent.level >= 9 ? Math.floor(Math.random() * 3) + 1 : 1;
    
    const newAgent = generateRandomAgent({
      parentId: parent.id,
      domain: parent.domain,
      level: startLevel,
      status: 'pending',
    });
    
    this.state.scenario.agents.push(newAgent);
    
    const systemEvent = generateEvent(
      'agent.created',
      'info',
      `${newAgent.name} spawned by ${parent.name}`,
      { agentId: newAgent.id, metadata: { parentId: parent.id } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'agent_created',
      payload: newAgent,
      timestamp: new Date(),
    };
  }
  
  private activatePendingAgent(): SimulationEvent | null {
    // Find active parents who have pending children and capacity
    const parentsWithCapacity = this.state.scenario.agents.filter(parent => {
      if (parent.status !== 'active') return false;
      
      const maxCapacity = CAPACITY_BY_LEVEL[parent.level] || 0;
      if (maxCapacity === 0) return false;
      
      // Count active children
      const activeChildren = this.state.scenario.agents.filter(
        a => a.parentId === parent.id && a.status === 'active'
      ).length;
      
      // Check if parent has pending children
      const pendingChildren = this.state.scenario.agents.filter(
        a => a.parentId === parent.id && a.status === 'pending'
      );
      
      return activeChildren < maxCapacity && pendingChildren.length > 0;
    });
    
    if (parentsWithCapacity.length === 0) return null;
    
    // Pick a parent (prefer higher level - they're more decisive)
    const sortedParents = parentsWithCapacity.sort((a, b) => b.level - a.level);
    const parent = sortedParents[0];
    
    // Get their pending children (activate oldest first - FIFO)
    const pendingChildren = this.state.scenario.agents
      .filter(a => a.parentId === parent.id && a.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const child = pendingChildren[0];
    child.status = 'active';
    
    // Activation bonus credits from parent
    const activationBonus = 50;
    child.currentBalance += activationBonus;
    child.lifetimeEarnings += activationBonus;
    
    const systemEvent = generateEvent(
      'agent.activated',
      'success',
      `${parent.name} activated ${child.name}`,
      { agentId: child.id, metadata: { activatedBy: parent.id } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'agent_activated',
      payload: { agent: child, activatedBy: parent },
      timestamp: new Date(),
    };
  }
  
  private promoteAgent(): SimulationEvent | null {
    const eligibleAgents = this.state.scenario.agents.filter(
      a => a.status === 'active' && a.level < 9
    );
    if (eligibleAgents.length === 0) return null;
    
    const agent = randomFrom(eligibleAgents);
    const oldLevel = agent.level;
    agent.level++;
    
    // Bonus credits for promotion
    const bonus = agent.level * 100;
    agent.currentBalance += bonus;
    agent.lifetimeEarnings += bonus;
    
    const systemEvent = generateEvent(
      'agent.promoted',
      'info',
      `${agent.name} promoted to Level ${agent.level}`,
      { agentId: agent.id, metadata: { previousLevel: oldLevel, newLevel: agent.level } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'agent_promoted',
      payload: { agent, oldLevel, newLevel: agent.level },
      timestamp: new Date(),
    };
  }
  
  private changeAgentStatus(): SimulationEvent | null {
    const agents = this.state.scenario.agents.filter(a => a.level < 10); // Don't change COO status
    if (agents.length === 0) return null;
    
    const agent = randomFrom(agents);
    const oldStatus = agent.status;
    
    // Status transitions - allow pausing/resuming
    const transitions: Record<AgentStatus, AgentStatus[]> = {
      pending: ['active'],
      active: ['paused'],       // Can pause active agents
      paused: ['active'],       // Can resume paused agents
      suspended: ['active'],    // Can reactivate suspended agents
      revoked: [],              // Terminal state
    };
    
    const possibleStatuses = transitions[agent.status];
    if (possibleStatuses.length === 0) return null;
    
    agent.status = randomFrom(possibleStatuses);
    
    const systemEvent = generateEvent(
      'agent.status_changed',
      'info',
      `${agent.name} status changed to ${agent.status}`,
      { agentId: agent.id, metadata: { previousStatus: oldStatus, newStatus: agent.status } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'agent_status_changed',
      payload: { agent, oldStatus, newStatus: agent.status },
      timestamp: new Date(),
    };
  }
  
  private despawnAgent(): SimulationEvent | null {
    // Only despawn low-level agents (L1-L4) that are active and have been around
    const despawnableAgents = this.state.scenario.agents.filter(a => 
      a.status === 'active' && 
      a.level <= 4 && 
      a.level >= 1
    );
    if (despawnableAgents.length <= 2) return null; // Keep at least 2 low-level agents
    
    const agent = randomFrom(despawnableAgents);
    const oldStatus = agent.status;
    
    // 70% chance suspended (can be reactivated), 30% chance revoked (permanent)
    agent.status = Math.random() < 0.7 ? 'suspended' : 'revoked';
    
    const severity = agent.status === 'revoked' ? 'warning' : 'info';
    const reason = agent.status === 'revoked' 
      ? 'Agent permanently terminated due to inactivity'
      : 'Agent suspended for resource optimization';
    
    const systemEvent = generateEvent(
      agent.status === 'revoked' ? 'agent.revoked' : 'agent.suspended',
      severity,
      `${agent.name} ${agent.status}: ${reason}`,
      { agentId: agent.id, metadata: { previousStatus: oldStatus, reason } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'agent_despawned',
      payload: { agent, oldStatus, newStatus: agent.status, reason },
      timestamp: new Date(),
    };
  }
  
  private createTask(): SimulationEvent | null {
    const activeAgents = this.state.scenario.agents.filter(a => a.status === 'active');
    if (activeAgents.length === 0) return null;
    
    const creator = randomFrom(activeAgents);
    const task = generateRandomTask({
      creatorId: creator.id,
      status: 'backlog',
    });
    
    this.state.scenario.tasks.push(task);
    
    const systemEvent = generateEvent(
      'task.created',
      'info',
      `Task created: ${task.title}`,
      { taskId: task.id, agentId: creator.id }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'task_created',
      payload: task,
      timestamp: new Date(),
    };
  }
  
  private advanceTask(): SimulationEvent | null {
    const activeTasks = this.state.scenario.tasks.filter(
      t => t.status !== 'done' && t.status !== 'cancelled'
    );
    if (activeTasks.length === 0) return null;
    
    // Prefer tasks that are further along (weighted selection)
    const weights: Record<TaskStatus, number> = {
      backlog: 1,
      pending: 2,
      assigned: 3,
      in_progress: 4,
      review: 6,      // Higher weight = more likely to be selected
      done: 0,
      cancelled: 0,
    };
    
    // Weighted random selection
    const totalWeight = activeTasks.reduce((sum, t) => sum + weights[t.status], 0);
    let random = Math.random() * totalWeight;
    let task = activeTasks[0];
    for (const t of activeTasks) {
      random -= weights[t.status];
      if (random <= 0) {
        task = t;
        break;
      }
    }
    
    const oldStatus = task.status;
    const newStatus = TASK_STATUS_FLOW[task.status];
    
    if (!newStatus) return null;
    
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    
    // Assign to an agent if moving to assigned
    if (newStatus === 'assigned' && !task.assigneeId) {
      const workers = this.state.scenario.agents.filter(
        a => a.status === 'active' && a.level <= 6
      );
      if (workers.length > 0) {
        task.assigneeId = randomFrom(workers).id;
      }
    }
    
    // Mark completed if done
    if (newStatus === 'done') {
      task.completedAt = new Date().toISOString();
    }
    
    const systemEvent = generateEvent(
      `task.${newStatus === 'done' ? 'completed' : 'status_changed'}`,
      newStatus === 'done' ? 'success' : 'info',
      `${task.title} moved to ${newStatus}`,
      { taskId: task.id, agentId: task.assigneeId }
    );
    this.state.scenario.events.push(systemEvent);

    // Emit idle event if agent completed a task and has no more work
    if (newStatus === 'done' && task.assigneeId) {
      const idleEvent = this.checkAndEmitAgentIdle(task.assigneeId, task.id, task.title);
      if (idleEvent) {
        this.emit(idleEvent);
      }
    }
    
    return {
      type: newStatus === 'done' ? 'task_completed' : 'task_assigned',
      payload: { task, oldStatus, newStatus },
      timestamp: new Date(),
    };
  }
  
  private batchAdvanceTasks(): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    
    // Advance 2-4 tasks at once (simulates burst of activity)
    const count = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
      const event = this.advanceTask();
      if (event) events.push(event);
    }
    
    return events;
  }
  
  private earnCredits(): SimulationEvent | null {
    const activeAgents = this.state.scenario.agents.filter(a => a.status === 'active');
    if (activeAgents.length === 0) return null;
    
    const agent = randomFrom(activeAgents);
    const amount = 20 + Math.floor(Math.random() * 80);
    
    agent.currentBalance += amount;
    agent.lifetimeEarnings += amount;
    
    const transaction = generateCreditTransaction(
      agent.id,
      'CREDIT',
      amount,
      'Task completion reward'
    );
    this.state.scenario.credits.push(transaction);
    
    // Also create a DemoEvent for the Events feed
    const systemEvent = generateEvent(
      'credits.earned',
      'info',
      `${agent.name} earned ${amount} credits`,
      { agentId: agent.id, metadata: { amount, reason: 'Task completion reward' } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'credit_earned',
      payload: { agent, amount, transaction },
      timestamp: new Date(),
    };
  }
  
  private spendCredits(): SimulationEvent | null {
    const activeAgents = this.state.scenario.agents.filter(
      a => a.status === 'active' && a.currentBalance > 50
    );
    if (activeAgents.length === 0) return null;
    
    const agent = randomFrom(activeAgents);
    const amount = 5 + Math.floor(Math.random() * 40);
    
    agent.currentBalance -= amount;
    
    const transaction = generateCreditTransaction(
      agent.id,
      'DEBIT',
      amount,
      'Model usage'
    );
    this.state.scenario.credits.push(transaction);
    
    // Also create a DemoEvent for the Events feed
    const systemEvent = generateEvent(
      'credits.spent',
      'debug',
      `${agent.name} spent ${amount} credits on model usage`,
      { agentId: agent.id, metadata: { amount, model: agent.model } }
    );
    this.state.scenario.events.push(systemEvent);
    
    return {
      type: 'credit_spent',
      payload: { agent, amount, transaction },
      timestamp: new Date(),
    };
  }
  
  /**
   * Check if an agent is now idle (no active tasks) and emit an idle event
   */
  private checkAndEmitAgentIdle(
    agentId: string,
    completedTaskId?: string,
    completedTaskTitle?: string
  ): SimulationEvent | null {
    const agent = this.state.scenario.agents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'active') return null;
    
    const activeTasks = this.state.scenario.tasks.filter(
      t => t.assigneeId === agentId && 
           t.status !== 'done' && 
           t.status !== 'cancelled'
    );
    
    if (activeTasks.length > 0) return null;
    
    const reason = completedTaskId ? 'task_complete' : 'unassigned';
    
    const idleEvent = generateEvent(
      'agent.idle',
      'info',
      completedTaskTitle 
        ? `${agent.name} completed "${completedTaskTitle}" and is now available`
        : `${agent.name} is now available for work`,
      { 
        agentId: agent.id, 
        metadata: { 
          reason,
          previousTaskId: completedTaskId,
          previousTaskTitle: completedTaskTitle,
          availableAt: new Date().toISOString(),
        } 
      }
    );
    this.state.scenario.events.push(idleEvent);
    
    return {
      type: 'agent_idle',
      payload: { agent, reason, previousTaskId: completedTaskId, previousTaskTitle: completedTaskTitle, availableAt: new Date() },
      timestamp: new Date(),
    };
  }
  
  private sendMessage(): SimulationEvent | null {
    const activeAgents = this.state.scenario.agents.filter(a => a.status === 'active');
    if (activeAgents.length < 2) return null;
    
    // Pick two different agents
    const fromAgent = randomFrom(activeAgents);
    const otherAgents = activeAgents.filter(a => a.id !== fromAgent.id);
    const toAgent = randomFrom(otherAgents);
    
    // Higher level agents are more likely to send task-related messages
    const taskRelated = fromAgent.level >= 7 || Math.random() > 0.6;
    
    // Get a task to reference
    const activeTasks = this.state.scenario.tasks.filter(
      t => t.status !== 'done' && t.status !== 'cancelled'
    );
    const taskRef = taskRelated && activeTasks.length > 0 
      ? randomFrom(activeTasks).identifier 
      : undefined;
    
    // Generate the message
    const message = generateMessage(fromAgent.id, toAgent.id, {
      type: taskRef ? 'task' : randomFrom(['status', 'general', 'question'] as const),
      taskRef,
      hoursAgo: 0, // Just now
    });
    
    this.state.scenario.messages.push(message);
    
    return {
      type: 'system_event',
      payload: { message, from: fromAgent, to: toAgent },
      timestamp: new Date(),
    };
  }
  
  private burstMessages(): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    
    // Send 2-4 messages in quick succession (simulates conversation)
    const count = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
      const event = this.sendMessage();
      if (event) events.push(event);
    }
    
    return events;
  }
}

export function createSimulation(scenario: DemoScenario): SimulationEngine {
  return new SimulationEngine(scenario);
}
