// ── Decision Recorder ───────────────────────────────────────────────────────
// Records LLM agent decisions to markdown files for replay/demo purposes.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SandboxAgent } from './types.js';
import type { AgentDecision } from './markdown-decision.js';

export interface RecordedDecision {
  tick: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  agentLevel: number;
  decision: AgentDecision;
  tokensUsed?: number;
  durationMs?: number;
}

export interface RecordingSummary {
  totalTasks: number;
  tasksDone: number;
  completionRate: number;
  totalMessages: number;
  agentCount: number;
  durationMs: number;
}

export class DecisionRecorder {
  private entries: RecordedDecision[] = [];
  private scenarioName: string;
  private model: string;
  private startTime: number;
  private summary: RecordingSummary | null = null;

  constructor(scenarioName: string, model: string) {
    this.scenarioName = scenarioName;
    this.model = model;
    this.startTime = Date.now();
  }

  /** Attach final simulation stats before saving */
  setSummary(summary: RecordingSummary): void {
    this.summary = summary;
  }

  record(
    agent: SandboxAgent,
    decision: AgentDecision,
    tick: number,
    tokensUsed?: number,
    durationMs?: number,
  ): void {
    this.entries.push({
      tick,
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      agentLevel: agent.level,
      decision,
      tokensUsed,
      durationMs,
    });
  }

  get entryCount(): number {
    return this.entries.length;
  }

  toMarkdown(): string {
    const maxTick = this.entries.length > 0
      ? Math.max(...this.entries.map(e => e.tick))
      : 0;
    const uniqueAgents = new Set(this.entries.map(e => e.agentId)).size;

    // Action distribution
    const actionCounts: Record<string, number> = {};
    for (const e of this.entries) {
      actionCounts[e.decision.action] = (actionCounts[e.decision.action] || 0) + 1;
    }
    const actionLines = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([action, count]) => {
        const pct = this.entries.length > 0 ? Math.round((count / this.entries.length) * 100) : 0;
        return `${action}: ${count} (${pct}%)`;
      })
      .join(', ');

    // Average latency
    const withDuration = this.entries.filter(e => e.durationMs);
    const avgLatency = withDuration.length > 0
      ? Math.round(withDuration.reduce((s, e) => s + (e.durationMs || 0), 0) / withDuration.length)
      : 0;

    const header = `---
scenario: ${this.scenarioName}
recorded: ${new Date(this.startTime).toISOString()}
model: ${this.model}
ticks: ${maxTick}
agents: ${uniqueAgents}
decisions: ${this.entries.length}
actions: ${actionLines}
avg_latency_ms: ${avgLatency}${this.summary ? `
tasks_total: ${this.summary.totalTasks}
tasks_done: ${this.summary.tasksDone}
completion_rate: ${this.summary.completionRate}%
total_messages: ${this.summary.totalMessages}
duration_ms: ${this.summary.durationMs}` : ''}
---

# Scenario: ${this.scenarioName}

## Stats
- **Decisions:** ${this.entries.length} across ${maxTick} ticks by ${uniqueAgents} agents
- **Actions:** ${actionLines}
- **Avg latency:** ${avgLatency}ms per LLM call${this.summary ? `
- **Tasks:** ${this.summary.tasksDone}/${this.summary.totalTasks} completed (${this.summary.completionRate}%)
- **Messages:** ${this.summary.totalMessages}
- **Duration:** ${(this.summary.durationMs / 1000).toFixed(1)}s` : ''}
`;

    const body = this.entries.map(e => {
      const latency = e.durationMs ? ` (${e.durationMs}ms)` : '';
      return `
## Tick ${e.tick} — ${e.agentName} (${e.agentRole.toUpperCase()}, L${e.agentLevel})${latency}
- Action: ${e.decision.action}
- Target: ${e.decision.target}
- Task: ${e.decision.task}
- Message: ${e.decision.message}`;
    }).join('\n');

    return header + body + '\n';
  }

  async save(dir: string): Promise<string> {
    mkdirSync(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = this.scenarioName.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 50);
    const filename = `${timestamp}-${safeName}.md`;
    const filepath = join(dir, filename);
    writeFileSync(filepath, this.toMarkdown(), 'utf-8');
    return filepath;
  }
}
