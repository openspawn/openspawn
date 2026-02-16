// ── LLM Provider ────────────────────────────────────────────────────────────
// Supports Ollama (local, $0) and Anthropic (cloud) providers.
// Returns free-form markdown (no JSON format constraint).
//
// Environment variables:
//   LLM_PROVIDER       - "ollama" (default) or "anthropic"
//   LLM_MODEL          - Model name (auto-defaults per provider)
//   LLM_BASE_URL       - API base URL (auto-defaults per provider)
//   LLM_MAX_TOKENS     - Max output tokens (default: 200)
//   LLM_TEMPERATURE    - Sampling temperature (default: 0.5)
//   LLM_TIMEOUT_MS     - Request timeout (default: 30000 anthropic, 10000 ollama)
//   ANTHROPIC_API_KEY   - Required for anthropic provider

export type LLMProvider = 'ollama' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface LLMResponse {
  text: string;
  tokens: number;
  durationMs: number;
  inputTokens?: number;
  cost?: number; // estimated USD cost for this call
}

// ── Pricing (USD per million tokens) ────────────────────────────────────────

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-0-20250514': { input: 15, output: 75 },
  'claude-sonnet-4-5-20250514': { input: 3, output: 15 },
  'claude-sonnet-4-0-20250514': { input: 3, output: 15 },
  'claude-haiku-3-5-20241022': { input: 0.8, output: 4 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Find pricing by prefix match (e.g. "claude-opus-4-0-20250514" matches "claude-opus")
  const pricing = PRICING[model] ||
    Object.entries(PRICING).find(([k]) => model.startsWith(k.split('-').slice(0, 3).join('-')))?.[1];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

/** Read LLM config from environment with sensible defaults */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'ollama') as LLMProvider;
  const isAnthropic = provider === 'anthropic';

  return {
    provider,
    model: process.env.LLM_MODEL || (isAnthropic ? 'claude-opus-4-0-20250514' : 'qwen2.5:7b-instruct'),
    baseUrl: process.env.LLM_BASE_URL || (isAnthropic ? 'https://api.anthropic.com' : 'http://localhost:11434'),
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 200,
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.5,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || (isAnthropic ? 30000 : 10000),
  };
}

/** Generate a response from the configured LLM provider */
export async function generate(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  if (config.provider === 'anthropic') {
    return generateAnthropic(prompt, config);
  }
  return generateOllama(prompt, config);
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

/** Check if the configured LLM provider is reachable */
export async function isLLMAvailable(config: LLMConfig): Promise<boolean> {
  if (config.provider === 'anthropic') {
    // For Anthropic, just check that the API key is set.
    // A real health check would cost tokens; we'll catch errors on first call.
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
