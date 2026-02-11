// ── Agent Config Loader ──────────────────────────────────────────────────────
// Loads agent configuration from the org/agents/ directory structure

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AgentConfig {
  soul?: string;      // Content of SOUL.md
  agents?: string;    // Content of AGENTS.md
  tools?: string;     // Content of TOOLS.md
  identity?: string;  // Content of IDENTITY.md
  memory?: string;    // Content of MEMORY.md
}

const CONFIG_FILES = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md', 'MEMORY.md'] as const;
const FILE_TO_KEY: Record<string, keyof AgentConfig> = {
  'SOUL.md': 'soul',
  'AGENTS.md': 'agents',
  'TOOLS.md': 'tools',
  'IDENTITY.md': 'identity',
  'MEMORY.md': 'memory',
};

/** Load config for an agent, with _defaults fallback */
export function loadAgentConfig(agentId: string, orgDir: string): AgentConfig {
  const agentDir = join(orgDir, 'agents', agentId);
  const defaultsDir = join(orgDir, 'agents', '_defaults');
  const config: AgentConfig = {};

  for (const file of CONFIG_FILES) {
    const key = FILE_TO_KEY[file];
    const agentPath = join(agentDir, file);
    const defaultPath = join(defaultsDir, file);

    if (existsSync(agentPath)) {
      config[key] = readFileSync(agentPath, 'utf-8');
    } else if (existsSync(defaultPath)) {
      config[key] = readFileSync(defaultPath, 'utf-8');
    }
  }

  return config;
}

/** Build system prompt from config (soul + agents + identity) */
export function buildSystemPrompt(config: AgentConfig, orgIdentity?: string): string {
  const parts: string[] = [];

  if (config.soul) parts.push(config.soul.trim());
  if (config.identity) parts.push(config.identity.trim());
  if (orgIdentity) parts.push(orgIdentity.trim());
  if (config.agents) parts.push(config.agents.trim());

  return parts.join('\n\n');
}
