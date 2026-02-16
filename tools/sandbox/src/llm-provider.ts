// ── LLM Provider ────────────────────────────────────────────────────────────
// Supports Ollama (local, $0), Anthropic (cloud), and OpenAI-compatible APIs
// (Groq, OpenRouter, Together, etc.).
//
// Environment variables:
//   LLM_PROVIDER        - "ollama" (default), "anthropic", or "openai"
//   LLM_MODEL           - Model name (auto-defaults per provider)
//   LLM_BASE_URL        - API base URL (auto-defaults per provider)
//   LLM_API_KEY         - API key (also reads ANTHROPIC_API_KEY, GROQ_API_KEY)
//   LLM_MAX_TOKENS      - Max output tokens (default: 200)
//   LLM_TEMPERATURE     - Sampling temperature (default: 0.5)
//   LLM_TIMEOUT_MS      - Request timeout (default: 30000 cloud, 10000 ollama)
//   LLM_RATE_LIMIT_RPM  - Max requests per minute (default: 0 = unlimited)
//   LLM_MAX_RETRIES     - Max retries on 429/5xx (default: 3)

export type LLMProvider = 'ollama' | 'anthropic' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  rateLimitRPM: number;
  maxRetries: number;
}

export interface LLMResponse {
  text: string;
  tokens: number;
  durationMs: number;
  inputTokens?: number;
  cost?: number;
}

// ── Pricing (USD per million tokens) ────────────────────────────────────────

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-0-20250514': { input: 15, output: 75 },
  'claude-sonnet-4-5-20250514': { input: 3, output: 15 },
  'claude-sonnet-4-0-20250514': { input: 3, output: 15 },
  'claude-haiku-3-5-20241022': { input: 0.8, output: 4 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ||
    Object.entries(PRICING).find(([k]) => model.startsWith(k.split('-').slice(0, 3).join('-')))?.[1];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

// ── Rate Limiter ────────────────────────────────────────────────────────────

class RateLimiter {
  private minIntervalMs: number;
  private lastCallTime: number = 0;

  constructor(rpm: number) {
    // Convert RPM to minimum interval between calls (with 10% safety margin)
    this.minIntervalMs = rpm > 0 ? Math.ceil((60_000 / rpm) * 1.1) : 0;
  }

  async wait(): Promise<void> {
    if (this.minIntervalMs === 0) return;
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      const delay = this.minIntervalMs - elapsed;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastCallTime = Date.now();
  }
}

let rateLimiter: RateLimiter | null = null;

function getRateLimiter(config: LLMConfig): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter(config.rateLimitRPM);
  }
  return rateLimiter;
}

// ── Config ──────────────────────────────────────────────────────────────────

function resolveApiKey(provider: LLMProvider): string {
  return process.env.LLM_API_KEY
    || process.env.ANTHROPIC_API_KEY
    || process.env.GROQ_API_KEY
    || process.env.OPENROUTER_API_KEY
    || '';
}

const PROVIDER_DEFAULTS: Record<LLMProvider, { model: string; baseUrl: string; rpm: number }> = {
  ollama: { model: 'qwen2.5:7b-instruct', baseUrl: 'http://localhost:11434', rpm: 0 },
  anthropic: { model: 'claude-opus-4-0-20250514', baseUrl: 'https://api.anthropic.com', rpm: 0 },
  openai: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', baseUrl: 'https://api.groq.com/openai', rpm: 30 },
};

/** Read LLM config from environment with sensible defaults */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'ollama') as LLMProvider;
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.ollama;
  const isCloud = provider !== 'ollama';

  return {
    provider,
    model: process.env.LLM_MODEL || defaults.model,
    baseUrl: process.env.LLM_BASE_URL || defaults.baseUrl,
    apiKey: resolveApiKey(provider),
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 200,
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.5,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || (isCloud ? 30000 : 10000),
    rateLimitRPM: Number(process.env.LLM_RATE_LIMIT_RPM) || defaults.rpm,
    maxRetries: Number(process.env.LLM_MAX_RETRIES) || 3,
  };
}

// ── Generate (unified entry point) ──────────────────────────────────────────

/** Generate a response from the configured LLM provider */
export async function generate(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  // Rate limit before calling
  await getRateLimiter(config).wait();

  // Dispatch to provider with retry logic
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      switch (config.provider) {
        case 'anthropic': return await generateAnthropic(prompt, config);
        case 'openai': return await generateOpenAI(prompt, config);
        default: return await generateOllama(prompt, config);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check for rate limit (429) — parse retry-after and wait
      if (lastError.message.includes('429') && attempt < config.maxRetries) {
        const retryAfter = parseRetryAfter(lastError.message);
        const backoffMs = retryAfter || Math.min(2000 * Math.pow(2, attempt), 60000);
        console.log(`  ⏳ Rate limited, waiting ${(backoffMs / 1000).toFixed(1)}s (attempt ${attempt + 1}/${config.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // Retry on 5xx server errors
      if (lastError.message.match(/5\d\d/) && attempt < config.maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        console.log(`  ⏳ Server error, retrying in ${(backoffMs / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      throw lastError;
    }
  }
  throw lastError || new Error('LLM generate failed after retries');
}

/** Parse retry-after seconds from error message or header */
function parseRetryAfter(message: string): number | null {
  // Look for "retry-after: Xs" or "retry_after":X or "Please try again in Xs"
  const match = message.match(/retry.?after[:\s"]*(\d+(?:\.\d+)?)/i)
    || message.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000); // convert to ms
  return null;
}

// ── OpenAI-Compatible API (Groq, OpenRouter, Together, etc.) ────────────────

async function generateOpenAI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  if (!config.apiKey) {
    throw new Error('API key not set (LLM_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY)');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI-compatible API returned ${res.status}: ${body}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content ?? '';
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const cost = estimateCost(config.model, inputTokens, outputTokens);

    return {
      text,
      tokens: outputTokens,
      inputTokens,
      durationMs: Date.now() - start,
      cost,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Anthropic Messages API ──────────────────────────────────────────────────

async function generateAnthropic(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  if (!config.apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic API returned ${res.status}: ${body}`);
    }

    const data = await res.json() as {
      content?: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const text = data.content?.find(c => c.type === 'text')?.text ?? '';
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const cost = estimateCost(config.model, inputTokens, outputTokens);

    return {
      text,
      tokens: outputTokens,
      inputTokens,
      durationMs: Date.now() - start,
      cost,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Ollama /api/generate ────────────────────────────────────────────────────

async function generateOllama(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        options: {
          num_predict: config.maxTokens,
          temperature: config.temperature,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as {
      response?: string;
      eval_count?: number;
      total_duration?: number;
    };

    return {
      text: data.response ?? '',
      tokens: data.eval_count ?? 0,
      durationMs: data.total_duration ? Math.round(data.total_duration / 1_000_000) : 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Availability Check ──────────────────────────────────────────────────────

/** Check if the configured LLM provider is reachable */
export async function isLLMAvailable(config: LLMConfig): Promise<boolean> {
  if (config.provider === 'anthropic' || config.provider === 'openai') {
    return !!config.apiKey;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${config.baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// Legacy alias
export const isOllamaAvailable = isLLMAvailable;
