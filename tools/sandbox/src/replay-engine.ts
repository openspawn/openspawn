// ── Replay Engine ───────────────────────────────────────────────────────────
// Loads recorded scenario markdown files and plays them back deterministically.
// Powers the hosted demo at zero LLM cost.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicSimulation } from './deterministic.js';
import { resolveAgentId, type DecisionAction, type AgentDecision } from './markdown-decision.js';
import { executeDecision, type ExecutionContext } from './decision-executor.js';
import type { SandboxAgent, SandboxConfig } from './types.js';
import type { ParsedOrg } from './org-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReplayScenario {
  name: string;
  keywords: string[];
  decisions: ReplayDecision[];
  metadata: { model: string; recorded: string; ticks: number; agents: number };
}

export interface ReplayDecision {
  tick: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  agentLevel: number;
  action: DecisionAction;
  target: string;
  task: string;
  message: string;
}

// ── Stop words ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'our', 'my', 'your', 'their', 'his', 'her', 'its',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
  'and', 'or', 'but', 'not', 'no', 'so', 'if', 'then',
  'i', 'we', 'you', 'they', 'he', 'she', 'it',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should',
  'have', 'has', 'had', 'get', 'got',
  'that', 'this', 'these', 'those', 'what', 'which', 'who',
  'more', 'some', 'any', 'all', 'each', 'every',
  'up', 'out', 'about', 'into', 'over', 'just', 'also',
  'need', 'want', 'run', 'make',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// ── Scenario Loader ─────────────────────────────────────────────────────────

export function loadScenarios(dir: string): ReplayScenario[] {
  const scenarios: ReplayScenario[] = [];
  const dirs = [dir];
  const recordedDir = join(dir, 'recorded');
  if (existsSync(recordedDir)) dirs.push(recordedDir);

  for (const d of dirs) {
    if (!existsSync(d)) continue;
    const files = readdirSync(d).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = readFileSync(join(d, file), 'utf8');
        const scenario = parseScenarioFile(content);
        if (scenario) scenarios.push(scenario);
      } catch (err) {
        console.log(`  ⚠️ Failed to parse scenario ${file}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return scenarios;
}

function parseScenarioFile(content: string): ReplayScenario | null {
  // Parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const get = (key: string): string => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m?.[1]?.trim() ?? '';
  };

  const name = get('scenario');
  if (!name) return null;

  const metadata = {
    model: get('model') || 'unknown',
    recorded: get('recorded') || new Date().toISOString(),
    ticks: parseInt(get('ticks')) || 10,
    agents: parseInt(get('agents')) || 1,
  };

  // Extract keywords from frontmatter + scenario name
  const fmKeywords = get('keywords').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const nameKeywords = tokenize(name);

  // Parse decisions
  const decisions: ReplayDecision[] = [];
  const tickRegex = /^## Tick (\d+) — (.+?) \((\w+),\s*L(\d+)\)/gm;
  let match: RegExpExecArray | null;

  while ((match = tickRegex.exec(content)) !== null) {
    const tick = parseInt(match[1]);
    const agentName = match[2].trim();
    const agentRole = match[3].trim().toLowerCase();
    const agentLevel = parseInt(match[4]);

    // Find the block after this header until next ## or end
    const startIdx = match.index + match[0].length;
    const nextHeader = content.indexOf('\n## ', startIdx);
    const block = content.slice(startIdx, nextHeader === -1 ? undefined : nextHeader);

    const action = (block.match(/- Action:\s*(\w+)/)?.[1] ?? 'message') as DecisionAction;
    const target = block.match(/- Target:\s*(.+)/)?.[1]?.trim() ?? 'none';
    const task = block.match(/- Task:\s*(.+)/)?.[1]?.trim() ?? '';
    const message = block.match(/- Message:\s*(.+)/)?.[1]?.trim() ?? '';

    decisions.push({
      tick,
      agentId: '', // resolved at runtime
      agentName,
      agentRole,
      agentLevel,
      action,
      target,
      task,
      message,
    });
  }

  if (decisions.length === 0) return null;

  // Build keyword list: frontmatter + name + decision messages
  const messageKeywords = decisions.flatMap(d => tokenize(d.message)).slice(0, 30);
  const allKeywords = [...new Set([...fmKeywords, ...nameKeywords, ...messageKeywords])];

  return { name, keywords: allKeywords, decisions, metadata };
}

// ── Scenario Matcher ────────────────────────────────────────────────────────

export function matchScenario(order: string, scenarios: ReplayScenario[]): ReplayScenario | null {
  if (scenarios.length === 0) return null;

  const orderTokens = tokenize(order);
  const orderLower = order.toLowerCase();
  let bestScore = 0;
  let bestScenario: ReplayScenario | null = null;

  for (const scenario of scenarios) {
    const scenarioLower = scenario.name.toLowerCase();

    // Substring containment bonus
    let score = 0;
    if (orderLower.includes(scenarioLower) || scenarioLower.includes(orderLower)) {
      score = 0.8;
    }

    // Keyword overlap
    const matchingKeywords = orderTokens.filter(t => scenario.keywords.includes(t));
    const totalKeywords = Math.max(orderTokens.length, 1);
    const keywordScore = matchingKeywords.length / totalKeywords;
    score = Math.max(score, keywordScore);

    // Also score by how many scenario keywords match the order
    const reverseMatching = scenario.keywords.filter(k => orderTokens.includes(k));
    const reverseScore = reverseMatching.length / Math.max(scenario.keywords.length, 1);
    score = Math.max(score, (keywordScore + reverseScore) / 2 + reverseScore * 0.3);

    if (score > bestScore) {
      bestScore = score;
      bestScenario = scenario;
    }
  }

  if (bestScenario && bestScore > 0.3) {
    console.log(`[Replay] Matched "${bestScenario.name}" (score: ${bestScore.toFixed(2)}) for order: "${order.slice(0, 60)}..."`);
    return bestScenario;
  }

  console.log(`[Replay] No scenario matched for order: "${order.slice(0, 60)}..." (best score: ${bestScore.toFixed(2)})`);
  return null;
}

// ── Replay Simulation ───────────────────────────────────────────────────────

export class ReplaySimulation extends DeterministicSimulation {
  private scenarios: ReplayScenario[];
  private queuedDecisions: Map<number, ReplayDecision[]> = new Map();
  private replayActive = false;
  private replayMaxTick = 0;

  constructor(
    agents: SandboxAgent[],
    config: SandboxConfig,
    skipSeedTasks = false,
    parsedOrg?: ParsedOrg,
  ) {
    super(agents, config, skipSeedTasks, parsedOrg);

    const scenariosDir = resolve(__dirname, '..', 'scenarios');
    this.scenarios = loadScenarios(scenariosDir);
    console.log(`\n🔁 Replay Simulation`);
    console.log(`   Loaded ${this.scenarios.length} scenario(s) from ${scenariosDir}`);
    for (const s of this.scenarios) {
      console.log(`   • "${s.name}" (${s.decisions.length} decisions, ${s.metadata.ticks} ticks)`);
    }
  }

  processOrder(order: string): void {
    const matched = matchScenario(order, this.scenarios);

    if (matched) {
      this.replayActive = true;
      this.queuedDecisions.clear();

      // Map replay ticks proportionally
      const maxRecordedTick = Math.max(...matched.decisions.map(d => d.tick), 1);
      const replayScale = Math.ceil(maxRecordedTick * 2.5);
      this.replayMaxTick = replayScale;

      for (const decision of matched.decisions) {
        const replayTick = Math.max(1, Math.round((decision.tick / maxRecordedTick) * replayScale));
        if (!this.queuedDecisions.has(replayTick)) {
          this.queuedDecisions.set(replayTick, []);
        }
        this.queuedDecisions.get(replayTick)!.push(decision);
      }

      const tickList = [...this.queuedDecisions.keys()].sort((a, b) => a - b);
      console.log(`[Replay] Queued ${matched.decisions.length} decisions across ticks: ${tickList.join(', ')}`);

      // Still call parent to set up the COO order handling (creates tasks, hires leads, etc.)
      // but the replay decisions will override L7+ behavior
      super.processOrder(order);
    } else {
      // No match — pure deterministic fallback
      super.processOrder(order);
    }
  }

  async runTick(): Promise<void> {
    // Execute any queued replay decisions for this tick BEFORE the deterministic tick
    if (this.replayActive && this.queuedDecisions.has(this.tick + 1)) {
      // peek at next tick since super.runTick() increments this.tick
    }

    // Let deterministic tick run first (it increments this.tick)
    await super.runTick();

    // Now execute replay decisions for the current tick
    if (this.replayActive) {
      const decisions = this.queuedDecisions.get(this.tick);
      if (decisions) {
        const ctx: ExecutionContext = {
          agents: this.agents,
          tasks: this.tasks,
          parsedOrgAgents: this.parsedOrg?.agents,
        };

        for (const decision of decisions) {
          // Resolve agent
          const agentId = resolveAgentId(decision.agentName, this.agents);
          const agent = agentId ? this.agents.find(a => a.id === agentId) : undefined;

          if (!agent) {
            console.log(`  🔁 ⚠️ Agent "${decision.agentName}" not found, skipping replay decision`);
            continue;
          }

          const agentDecision: AgentDecision = {
            action: decision.action,
            target: decision.target,
            task: decision.task,
            message: decision.message,
            raw: `[replay] ${decision.action} → ${decision.target}`,
          };

          console.log(`  🔁 ${agent.name}: ${decision.action} → ${decision.target} | ${decision.message.slice(0, 60)}`);
          executeDecision(agent, agentDecision, ctx);
        }

        this.queuedDecisions.delete(this.tick);
      }

      // Check if replay is done
      if (this.queuedDecisions.size === 0 && this.tick >= this.replayMaxTick) {
        this.replayActive = false;
        console.log(`[Replay] All replay decisions executed. Continuing in deterministic mode.`);
      }
    }
  }
}
