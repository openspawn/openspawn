// ── openclaw.json config reader/writer ───────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface AgentEntry {
  id: string;
  name?: string;
  default?: boolean;
  workspace?: string;
  agentDir?: string;
  tools?: { profile?: string };
  [key: string]: unknown;
}

export interface OpenClawConfig {
  agents?: {
    defaults?: Record<string, unknown>;
    list?: AgentEntry[];
  };
  [key: string]: unknown;
}

const CONFIG_PATH = join(homedir(), ".openclaw", "openclaw.json");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function readConfig(): OpenClawConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as OpenClawConfig;
}

export function writeConfig(config: OpenClawConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4) + "\n", "utf-8");
}

export function findAgent(config: OpenClawConfig, agentId: string): AgentEntry | undefined {
  return config.agents?.list?.find((a) => a.id === agentId);
}

export function addAgent(config: OpenClawConfig, agent: AgentEntry): OpenClawConfig {
  if (!config.agents) config.agents = {};
  if (!config.agents.list) config.agents.list = [];
  config.agents.list.push(agent);
  return config;
}

export function removeAgent(config: OpenClawConfig, agentId: string): OpenClawConfig {
  if (config.agents?.list) {
    config.agents.list = config.agents.list.filter((a) => a.id !== agentId);
  }
  return config;
}
