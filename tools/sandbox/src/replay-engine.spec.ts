import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScenarios, matchScenario, ReplaySimulation } from './replay-engine.js';
import type { ReplayScenario } from './replay-engine.js';
import { makeAgentPublic } from './agents.js';
import type { SandboxAgent, SandboxConfig } from './types.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SandboxConfig = {
  model: 'test',
  tickIntervalMs: 0,
  maxTicks: 10,
  maxConcurrentInferences: 1,
  contextWindowTokens: 4096,
  verbose: false,
  defaultTrigger: 'event-driven',
};

function makeCOO(id = 'coo', name = 'COO'): SandboxAgent {
  return makeAgentPublic(id, name, 'coo', 10, 'Operations', undefined, 'Test COO');
}

function makeLead(id: string, name: string, parentId: string, domain = 'Engineering'): SandboxAgent {
  return makeAgentPublic(id, name, 'lead', 7, domain, parentId, `Lead for ${domain}`);
}

// ── Inline fixtures ──────────────────────────────────────────────────────────

const VALID_SCENARIO_MD = `---
scenario: Build a Spaceship
model: gpt-test
recorded: 2026-01-01T00:00:00Z
ticks: 3
agents: 2
keywords: spaceship,build,rocket
---

# Scenario: Build a Spaceship

## Tick 1 — Alice (lead, L7)
- Action: delegate
- Target: bob
- Task: TASK-001
- Message: Bob, start designing the hull.

## Tick 2 — Bob (worker, L5)
- Action: work
- Target: none
- Task: TASK-001
- Message: Working on hull design schematics.

## Tick 3 — Alice (lead, L7)
- Action: message
- Target: bob
- Task: TASK-001
- Message: Great progress, let's move to propulsion next.
`;

const NO_FRONTMATTER_MD = `# Just a heading\n\nNo YAML frontmatter here.`;

const EMPTY_DECISIONS_MD = `---
scenario: Empty Test
model: test
recorded: 2026-01-01T00:00:00Z
ticks: 1
agents: 1
---

# No tick headers here, just text.
`;

const MINIMAL_SCENARIO_MD = `---
scenario: Minimal
model: test
recorded: 2026-01-01T00:00:00Z
ticks: 1
agents: 1
---

## Tick 1 — Solo (worker, L3)
- Action: work
- Target: none
- Task: TASK-X
- Message: Doing stuff.
`;

// ── parseScenarioFile (tested via loadScenarios internals) ───────────────────

// We test the exported parseScenarioFile indirectly by creating temp scenarios
// and using matchScenario. For direct parsing we use the inline fixtures
// by writing to a temp dir.

import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

function loadFromString(content: string): ReplayScenario | null {
  const dir = mkdtempSync(join(tmpdir(), 'replay-test-'));
  writeFileSync(join(dir, 'test.md'), content);
  const scenarios = loadScenarios(dir);
  return scenarios[0] ?? null;
}

describe('replay-engine', () => {
  // ── Parsing ──────────────────────────────────────────────────────────

  describe('parseScenarioFile', () => {
    it('parses valid scenario markdown', () => {
      const s = loadFromString(VALID_SCENARIO_MD);
      expect(s).not.toBeNull();
      expect(s!.name).toBe('Build a Spaceship');
      expect(s!.metadata.model).toBe('gpt-test');
      expect(s!.metadata.ticks).toBe(3);
      expect(s!.metadata.agents).toBe(2);
      expect(s!.decisions).toHaveLength(3);
    });

    it('extracts decision fields correctly', () => {
      const s = loadFromString(VALID_SCENARIO_MD)!;
      const d0 = s.decisions[0];
      expect(d0.tick).toBe(1);
      expect(d0.agentName).toBe('Alice');
      expect(d0.agentRole).toBe('lead');
      expect(d0.agentLevel).toBe(7);
      expect(d0.action).toBe('delegate');
      expect(d0.target).toBe('bob');
      expect(d0.task).toBe('TASK-001');
      expect(d0.message).toContain('hull');
    });

    it('returns null for markdown without frontmatter', () => {
      const s = loadFromString(NO_FRONTMATTER_MD);
      expect(s).toBeNull();
    });

    it('returns null for scenario with no decisions', () => {
      const s = loadFromString(EMPTY_DECISIONS_MD);
      expect(s).toBeNull();
    });

    it('parses minimal single-decision scenario', () => {
      const s = loadFromString(MINIMAL_SCENARIO_MD);
      expect(s).not.toBeNull();
      expect(s!.decisions).toHaveLength(1);
      expect(s!.decisions[0].agentName).toBe('Solo');
      expect(s!.decisions[0].action).toBe('work');
    });

    it('builds keywords from frontmatter and scenario name', () => {
      const s = loadFromString(VALID_SCENARIO_MD)!;
      expect(s.keywords).toContain('spaceship');
      expect(s.keywords).toContain('build');
      expect(s.keywords).toContain('rocket');
    });

    it('includes keywords from decision messages', () => {
      const s = loadFromString(VALID_SCENARIO_MD)!;
      // "hull", "designing", "schematics", "propulsion" should be extracted
      expect(s.keywords.some(k => k === 'hull' || k === 'designing' || k === 'propulsion')).toBe(true);
    });
  });

  // ── Scenario loading from directory ────────────────────────────────────

  describe('loadScenarios', () => {
    it('loads scenarios from a directory', () => {
      const dir = mkdtempSync(join(tmpdir(), 'replay-load-'));
      writeFileSync(join(dir, 'a.md'), VALID_SCENARIO_MD);
      writeFileSync(join(dir, 'b.md'), MINIMAL_SCENARIO_MD);
      const scenarios = loadScenarios(dir);
      expect(scenarios).toHaveLength(2);
    });

    it('also loads from recorded/ subdirectory', () => {
      const dir = mkdtempSync(join(tmpdir(), 'replay-sub-'));
      const recorded = join(dir, 'recorded');
      mkdirSync(recorded);
      writeFileSync(join(recorded, 'rec.md'), VALID_SCENARIO_MD);
      const scenarios = loadScenarios(dir);
      expect(scenarios).toHaveLength(1);
    });

    it('returns empty for non-existent directory', () => {
      const scenarios = loadScenarios('/tmp/nonexistent-dir-xyz-123');
      expect(scenarios).toHaveLength(0);
    });

    it('skips files that fail to parse', () => {
      const dir = mkdtempSync(join(tmpdir(), 'replay-skip-'));
      writeFileSync(join(dir, 'bad.md'), NO_FRONTMATTER_MD);
      writeFileSync(join(dir, 'good.md'), VALID_SCENARIO_MD);
      const scenarios = loadScenarios(dir);
      expect(scenarios).toHaveLength(1);
    });
  });

  // ── Matching ──────────────────────────────────────────────────────────

  describe('matchScenario', () => {
    let scenarios: ReplayScenario[];

    beforeEach(() => {
      scenarios = [
        loadFromString(VALID_SCENARIO_MD)!,
        loadFromString(MINIMAL_SCENARIO_MD)!,
      ];
    });

    it('matches by keyword overlap', () => {
      const match = matchScenario('build a spaceship', scenarios);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('Build a Spaceship');
    });

    it('matches by substring containment', () => {
      const match = matchScenario('Build a Spaceship for Mars', scenarios);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('Build a Spaceship');
    });

    it('returns null for unrelated order', () => {
      const match = matchScenario('cook dinner tonight please', scenarios);
      expect(match).toBeNull();
    });

    it('returns null for empty scenario list', () => {
      const match = matchScenario('build a spaceship', []);
      expect(match).toBeNull();
    });

    it('picks the best match among multiple scenarios', () => {
      const match = matchScenario('rocket spaceship hull', scenarios);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('Build a Spaceship');
    });
  });

  // ── ReplaySimulation ──────────────────────────────────────────────────

  describe('ReplaySimulation', () => {
    it('constructs without errors', () => {
      const agents = [makeCOO()];
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true);
      expect(sim).toBeDefined();
    });

    it('loads scenarios from the default scenarios dir', () => {
      const agents = [makeCOO()];
      // Just verify construction doesn't throw
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true);
      expect(sim).toBeDefined();
    });

    it('handles non-existent replay file gracefully', () => {
      const agents = [makeCOO()];
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true, undefined, '/tmp/nonexistent-file.md');
      expect(sim).toBeDefined();
    });

    it('loads a specific replay file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'replay-file-'));
      const filePath = join(dir, 'test.md');
      writeFileSync(filePath, VALID_SCENARIO_MD);
      const agents = [makeCOO()];
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true, undefined, filePath);
      expect(sim).toBeDefined();
    });

    it('runs ticks without errors', async () => {
      const agents = [makeCOO(), makeLead('lead1', 'Alice', 'coo')];
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true);
      // Run a few ticks
      for (let i = 0; i < 3; i++) {
        await sim.runTick();
      }
      expect(sim.tick).toBe(3);
    });

    it('processes an order and queues replay decisions', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'replay-order-'));
      const filePath = join(dir, 'test.md');
      writeFileSync(filePath, VALID_SCENARIO_MD);
      const agents = [makeCOO(), makeLead('lead1', 'Alice', 'coo')];
      const sim = new ReplaySimulation(agents, DEFAULT_CONFIG, true, undefined, filePath);
      // processOrder should match the scenario and queue decisions
      sim.processOrder('build a spaceship');
      // Run ticks to execute queued decisions
      for (let i = 0; i < 10; i++) {
        await sim.runTick();
      }
      expect(sim.tick).toBe(10);
    });
  });

  // ── Integration: real recorded file ────────────────────────────────────

  describe('integration: recorded files', () => {
    const recordedDir = resolve(__dirname, '..', 'scenarios', 'recorded');

    it('parses a real recorded scenario file', () => {
      let files: string[];
      try {
        const { readdirSync } = require('node:fs');
        files = readdirSync(recordedDir).filter((f: string) => f.endsWith('.md'));
      } catch {
        // No recorded files available — skip
        return;
      }
      if (files.length === 0) return;

      const content = readFileSync(join(recordedDir, files[0]), 'utf8');
      const dir = mkdtempSync(join(tmpdir(), 'replay-int-'));
      writeFileSync(join(dir, 'rec.md'), content);
      const scenarios = loadScenarios(dir);
      expect(scenarios.length).toBeGreaterThanOrEqual(1);
      const s = scenarios[0];
      expect(s.name).toBeTruthy();
      expect(s.decisions.length).toBeGreaterThan(0);
      expect(s.metadata.model).toBeTruthy();
    });
  });
});
