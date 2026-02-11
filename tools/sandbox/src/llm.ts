// ── LLM Client ──────────────────────────────────────────────────────────────
// Unified inference layer: Groq (free) → OpenRouter → Ollama (local)
// Priority: GROQ_API_KEY > OPENROUTER_API_KEY > Ollama
// Groq is truly free (rate-limited, not credit-limited) — ideal for demos.

import type { SandboxAgent, AgentAction, SandboxConfig } from './types.js';

// ── Provider detection ──────────────────────────────────────────────────────

// Read env vars lazily (ES module imports are hoisted before .env loader runs)
const env = () => ({
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_URL: 'https://api.groq.com/openai/v1',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_URL: process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'google/gemma-3n-e2b-it:free',
  OPENROUTER_MANAGER_MODEL: process.env.OPENROUTER_MANAGER_MODEL || process.env.OPENROUTER_MODEL || 'google/gemma-3n-e2b-it:free',
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
});

export type Provider = 'groq' | 'openrouter' | 'ollama';

export function getProvider(): Provider {
  const forced = process.env.LLM_PROVIDER as Provider | undefined;
  if (forced && ['groq', 'openrouter', 'ollama'].includes(forced)) return forced;
  if (env().GROQ_API_KEY) return 'groq';
  if (env().OPENROUTER_API_KEY) return 'openrouter';
  return 'ollama';
}

export function getProviderInfo(): string {
  switch (getProvider()) {
    case 'groq': return `Groq (model: ${env().GROQ_MODEL}, free tier, 14.4K req/day)`;
    case 'openrouter': return `OpenRouter (workers: ${env().OPENROUTER_MODEL}, managers: ${env().OPENROUTER_MANAGER_MODEL})`;
    case 'ollama': return `Ollama (local)`;
  }
}

export function getModelName(): string {
  switch (getProvider()) {
    case 'groq': return env().GROQ_MODEL;
    case 'openrouter': return env().OPENROUTER_MODEL;
    case 'ollama': return process.env.SANDBOX_MODEL || 'qwen3:0.6b';
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  tokens: number;
}

// ── Semaphore ───────────────────────────────────────────────────────────────

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;
  constructor(private max: number) {}
  async acquire(): Promise<void> {
    if (this.running < this.max) { this.running++; return; }
    return new Promise(resolve => this.queue.push(() => { this.running++; resolve(); }));
  }
  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

let semaphore: Semaphore;

export async function initLLM(config: SandboxConfig): Promise<void> {
  const provider = getProvider();

  // Limit concurrency for cloud APIs to stay within rate limits
  // Groq: 30 RPM → 4 concurrent is safe with 5s ticks
  // OpenRouter free: ~20 RPM → 2 concurrent
  const maxConcurrent = provider === 'ollama'
    ? config.maxConcurrentInferences
    : provider === 'groq' ? 4 : 2;
  semaphore = new Semaphore(maxConcurrent);

  console.log(`  🧠 LLM provider: ${getProviderInfo()}`);
  console.log(`  🚦 Max concurrent: ${maxConcurrent}`);

  if (provider === 'groq') {
    // Quick validation — make sure the key works
    try {
      const res = await fetch(`${env().GROQ_URL}/models`, {
        headers: { 'Authorization': `Bearer ${env().GROQ_API_KEY}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { data: { id: string }[] };
      const modelExists = data.data.some(m => m.id === env().GROQ_MODEL);
      if (!modelExists) {
        console.warn(`  ⚠ Model "${env().GROQ_MODEL}" not found on Groq. Available: ${data.data.map(m => m.id).slice(0, 5).join(', ')}...`);
      }
      console.log(`  ✅ Groq API key valid`);
      console.log(`  💰 Cost: FREE (rate-limited, not credit-limited)`);
    } catch (err) {
      console.error(`  ❌ Groq API key validation failed: ${err}`);
    }
  }
}

// ── Retry wrapper ───────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

async function withRetry(
  agent: SandboxAgent,
  fn: () => Promise<Response>,
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fn();

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RETRY_BASE_MS * Math.pow(2, attempt);

      if (attempt < MAX_RETRIES) {
        console.log(`  ⏳ ${agent.name} rate limited, retry in ${Math.round(waitMs / 1000)}s (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      console.log(`  ⚠ ${agent.name} rate limited after ${MAX_RETRIES} retries`);
    }

    return response;
  }

  // Unreachable, but TypeScript
  throw new Error('Retry exhausted');
}

// ── Groq inference ──────────────────────────────────────────────────────────

async function callGroq(messages: ChatMessage[], agent: SandboxAgent): Promise<LLMResponse> {
  const response = await withRetry(agent, () =>
    fetch(`${env().GROQ_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env().GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env().GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 256,
      }),
    })
  );

  if (response.status === 429) {
    return { content: '{"action":"idle"}', tokens: 0 };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq error: ${response.status} ${text}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
  };
}

// ── OpenRouter inference ────────────────────────────────────────────────────

async function callOpenRouter(messages: ChatMessage[], agent: SandboxAgent): Promise<LLMResponse> {
  const model = agent.level >= 7 ? env().OPENROUTER_MANAGER_MODEL : env().OPENROUTER_MODEL;

  const response = await withRetry(agent, () =>
    fetch(`${env().OPENROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env().OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://bikinibottom.ai',
        'X-Title': 'BikiniBottom Sandbox',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 256,
      }),
    })
  );

  if (response.status === 429) {
    return { content: '{"action":"idle"}', tokens: 0 };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${text}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
  };
}

// ── Ollama inference ────────────────────────────────────────────────────────

async function callOllama(messages: ChatMessage[], config: SandboxConfig): Promise<LLMResponse> {
  const response = await fetch(`${env().OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages,
      options: { temperature: 0.7, num_predict: 256 },
      think: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as {
    message: { content: string };
    eval_count?: number;
  };

  return {
    content: data.message.content.trim(),
    tokens: data.eval_count ?? 0,
  };
}

// ── Unified inference ───────────────────────────────────────────────────────

export async function getAgentDecision(
  agent: SandboxAgent,
  context: string,
  config: SandboxConfig,
): Promise<AgentAction> {
  await semaphore.acquire();
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: context },
    ];

    const provider = getProvider();
    const { content: raw, tokens } = provider === 'groq'
      ? await callGroq(messages, agent)
      : provider === 'openrouter'
        ? await callOpenRouter(messages, agent)
        : await callOllama(messages, config);

    // Track inference cost
    agent.stats.creditsSpent += tokens;

    // Parse JSON from response
    let jsonStr = raw;

    // Strip markdown code fences
    jsonStr = jsonStr.replace(/^```json?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();

    // Strip thinking tags
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Strip leading non-JSON chars
    jsonStr = jsonStr.replace(/^[^{]*/, '');

    // Extract JSON object with brace counting
    const start = jsonStr.indexOf('{');
    if (start >= 0) {
      let depth = 0;
      let end = start;
      for (let i = start; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') depth++;
        else if (jsonStr[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      jsonStr = jsonStr.substring(start, end + 1);
    }

    try {
      return JSON.parse(jsonStr) as AgentAction;
    } catch {
      const fixed = jsonStr.replace(/"([^"]+)"\s*,\s*"/g, '"$1":"');
      try {
        return JSON.parse(fixed) as AgentAction;
      } catch {
        if (config.verbose) {
          console.log(`  ⚠ ${agent.name} unparseable: ${jsonStr.substring(0, 120)}`);
        }
        return { action: 'idle' };
      }
    }
  } finally {
    semaphore.release();
  }
}

// Re-export buildContext (context building logic stays in ollama.ts)
export { buildContext } from './ollama.js';
