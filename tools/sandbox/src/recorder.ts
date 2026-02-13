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

export class DecisionRecorder {
  private entries: RecordedDecision[] = [];
  private scenarioName: string;
  private model: string;
  private startTime: number;

  constructor(scenarioName: string, model: string) {
    this.scenarioName = scenarioName;
    this.model = model;
    this.startTime = Date.now();
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

    const header = `---
scenario: ${this.scenarioName}
recorded: ${new Date(this.startTime).toISOString()}
model: ${this.model}
ticks: ${maxTick}
agents: ${uniqueAgents}
---

# Scenario: ${this.scenarioName}
`;

    const body = this.entries.map(e => {
      return `
## Tick ${e.tick} — ${e.agentName} (${e.agentRole.toUpperCase()}, L${e.agentLevel})
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
