// ── Ollama LLM Provider ─────────────────────────────────────────────────────
// Lightweight client for Ollama's /api/generate endpoint.
// Returns free-form markdown (no JSON format constraint).

export interface LLMConfig {
  model: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface LLMResponse {
  text: string;
  tokens: number;
  durationMs: number;
}

/** Read LLM config from environment with sensible defaults */
export function getLLMConfig(): LLMConfig {
  return {
    model: process.env.LLM_MODEL || 'qwen2.5:7b-instruct',
    baseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434',
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 150,
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 10000,
  };
}

/** Call Ollama generate endpoint. Throws on timeout or network error. */
export async function generate(prompt: string, config: LLMConfig): Promise<LLMResponse> {
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

/** Check if Ollama is reachable */
export async function isOllamaAvailable(config: LLMConfig): Promise<boolean> {
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
