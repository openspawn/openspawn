// ── Model Router Engine ─────────────────────────────────────────────────────
// Simulated intelligent routing of LLM requests across providers with
// fallback chains, cost tracking, and rate limiting.
// No real API calls — purely simulated for the demo dashboard.

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  models: ModelConfig[];
  rateLimit?: { rpm: number; tpm: number };
  enabled: boolean;
  priority: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  contextWindow: number;
  capabilities: string[];
  maxTokens: number;
}

export interface RouteRequest {
  agentId?: string;
  agentLevel: number;
  taskType: 'delegation' | 'coding' | 'analysis' | 'simple';
  maxCost?: number;
  preferLocal: boolean;
}

export interface RouteDecision {
  provider: string;
  model: string;
  reason: string;
  fallbackChain: string[];
  estimatedCost: number;
  latencyEstimate: number;
  timestamp: number;
  agentId?: string;
  taskType: string;
}

export interface RouterMetrics {
  totalRequests: number;
  totalCost: number;
  requestsByProvider: Record<string, number>;
  costByProvider: Record<string, number>;
  avgLatencyByProvider: Record<string, number>;
  failuresByProvider: Record<string, number>;
  fallbacksTriggered: number;
  localRoutedCount: number;
  cloudOnlyCostEstimate: number;
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    models: [
      { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', costPer1kInput: 0, costPer1kOutput: 0, contextWindow: 32768, capabilities: ['chat', 'json-mode'], maxTokens: 4096 },
    ],
    enabled: true,
    priority: 1,
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', costPer1kInput: 0.05, costPer1kOutput: 0.08, contextWindow: 131072, capabilities: ['chat', 'json-mode'], maxTokens: 8192 },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', costPer1kInput: 0.59, costPer1kOutput: 0.79, contextWindow: 131072, capabilities: ['chat', 'json-mode', 'function-calling'], maxTokens: 8192 },
    ],
    rateLimit: { rpm: 30, tpm: 6000 },
    enabled: true,
    priority: 2,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', costPer1kInput: 3.0, costPer1kOutput: 15.0, contextWindow: 200000, capabilities: ['chat', 'json-mode', 'function-calling'], maxTokens: 8192 },
      { id: 'openai/gpt-4o', name: 'GPT-4o', costPer1kInput: 2.5, costPer1kOutput: 10.0, contextWindow: 128000, capabilities: ['chat', 'json-mode', 'function-calling'], maxTokens: 4096 },
    ],
    enabled: true,
    priority: 3,
  },
];

// Simulated latency ranges by provider (ms)
const LATENCY_RANGES: Record<string, [number, number]> = {
  ollama: [40, 150],
  groq: [80, 300],
  openrouter: [200, 800],
};

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class ModelRouter {
  private providers: ProviderConfig[];
  private metrics: RouterMetrics;
  private recentDecisions: RouteDecision[] = [];
  private requestCountByMinute: Record<string, number> = {};

  constructor(providers?: ProviderConfig[]) {
    this.providers = providers ? JSON.parse(JSON.stringify(providers)) : JSON.parse(JSON.stringify(DEFAULT_PROVIDERS));
    this.metrics = {
      totalRequests: 0,
      totalCost: 0,
      requestsByProvider: {},
      costByProvider: {},
      avgLatencyByProvider: {},
      failuresByProvider: {},
      fallbacksTriggered: 0,
      localRoutedCount: 0,
      cloudOnlyCostEstimate: 0,
    };
  }

  /** Route a request based on agent level and task type */
  route(req: RouteRequest): RouteDecision {
    const enabledProviders = this.providers.filter(p => p.enabled).sort((a, b) => a.priority - b.priority);
    if (enabledProviders.length === 0) {
      return { provider: 'none', model: 'none', reason: 'No providers enabled', fallbackChain: [], estimatedCost: 0, latencyEstimate: 0, timestamp: Date.now(), agentId: req.agentId, taskType: req.taskType };
    }

    let selectedProvider: ProviderConfig;
    let selectedModel: ModelConfig;
    let reason: string;

    // Determine tier based on agent level
    if (req.agentLevel >= 9) {
      // Executive tier — best models
      const or = enabledProviders.find(p => p.id === 'openrouter');
      if (or) {
        selectedProvider = or;
        selectedModel = or.models.find(m => m.id.includes('claude')) || or.models[0];
        reason = `L${req.agentLevel} executive → premium model`;
      } else {
        const groq = enabledProviders.find(p => p.id === 'groq');
        selectedProvider = groq || enabledProviders[0];
        selectedModel = selectedProvider.models.find(m => m.id.includes('70b')) || selectedProvider.models[0];
        reason = `L${req.agentLevel} executive → best available (OpenRouter unavailable)`;
        this.metrics.fallbacksTriggered++;
      }
    } else if (req.agentLevel >= 7) {
      // Mid-tier — Groq 70B or OpenRouter
      const groq = enabledProviders.find(p => p.id === 'groq');
      if (groq && !this.isRateLimited(groq)) {
        selectedProvider = groq;
        selectedModel = groq.models.find(m => m.id.includes('70b')) || groq.models[0];
        reason = `L${req.agentLevel} lead → mid-tier model`;
      } else {
        const or = enabledProviders.find(p => p.id === 'openrouter');
        selectedProvider = or || enabledProviders[0];
        selectedModel = selectedProvider.models[selectedProvider.models.length - 1] || selectedProvider.models[0];
        reason = `L${req.agentLevel} lead → fallback (Groq rate-limited)`;
        this.metrics.fallbacksTriggered++;
      }
    } else {
      // Worker tier — cheapest: Ollama first, then Groq 8B
      if (req.preferLocal) {
        const ollama = enabledProviders.find(p => p.id === 'ollama');
        if (ollama) {
          selectedProvider = ollama;
          selectedModel = ollama.models[0];
          reason = `L${req.agentLevel} worker → local (preferred)`;
        } else {
          const groq = enabledProviders.find(p => p.id === 'groq');
          selectedProvider = groq || enabledProviders[0];
          selectedModel = selectedProvider.models[0];
          reason = `L${req.agentLevel} worker → cheapest cloud (local unavailable)`;
          this.metrics.fallbacksTriggered++;
        }
      } else {
        const ollama = enabledProviders.find(p => p.id === 'ollama');
        const groq = enabledProviders.find(p => p.id === 'groq');
        // Randomly split between local and groq 8b for variety
        if (ollama && Math.random() < 0.6) {
          selectedProvider = ollama;
          selectedModel = ollama.models[0];
          reason = `L${req.agentLevel} worker → local ($0)`;
        } else if (groq && !this.isRateLimited(groq)) {
          selectedProvider = groq;
          selectedModel = groq.models[0];
          reason = `L${req.agentLevel} worker → Groq 8B (fast)`;
        } else if (ollama) {
          selectedProvider = ollama;
          selectedModel = ollama.models[0];
          reason = `L${req.agentLevel} worker → local (Groq rate-limited)`;
          this.metrics.fallbacksTriggered++;
        } else {
          selectedProvider = enabledProviders[0];
          selectedModel = selectedProvider.models[0];
          reason = `L${req.agentLevel} worker → only available provider`;
        }
      }
    }

    // Build fallback chain
    const fallbackChain = enabledProviders
      .filter(p => p.id !== selectedProvider.id)
      .flatMap(p => p.models.map(m => `${p.id}/${m.id}`));

    // Simulate cost (assume ~500 input tokens, ~200 output tokens per request)
    const inputTokens = req.taskType === 'analysis' ? 1.2 : req.taskType === 'coding' ? 0.8 : 0.5;
    const outputTokens = req.taskType === 'coding' ? 0.5 : 0.2;
    const estimatedCost = (selectedModel.costPer1kInput * inputTokens) + (selectedModel.costPer1kOutput * outputTokens);

    // Simulate latency
    const range = LATENCY_RANGES[selectedProvider.id] || [100, 500];
    const latencyEstimate = randomInRange(range[0], range[1]);

    const decision: RouteDecision = {
      provider: selectedProvider.id,
      model: selectedModel.id,
      reason,
      fallbackChain,
      estimatedCost,
      latencyEstimate,
      timestamp: Date.now(),
      agentId: req.agentId,
      taskType: req.taskType,
    };

    // Track metrics
    this.recordDecision(decision, selectedProvider, selectedModel, inputTokens, outputTokens);

    return decision;
  }

  private isRateLimited(provider: ProviderConfig): boolean {
    if (!provider.rateLimit) return false;
    const minuteKey = `${provider.id}:${Math.floor(Date.now() / 60000)}`;
    const count = this.requestCountByMinute[minuteKey] || 0;
    return count >= provider.rateLimit.rpm;
  }

  private recordDecision(decision: RouteDecision, provider: ProviderConfig, model: ModelConfig, inputK: number, outputK: number): void {
    this.metrics.totalRequests++;
    this.metrics.requestsByProvider[provider.id] = (this.metrics.requestsByProvider[provider.id] || 0) + 1;
    this.metrics.costByProvider[provider.id] = (this.metrics.costByProvider[provider.id] || 0) + decision.estimatedCost;
    this.metrics.totalCost += decision.estimatedCost;

    // Track latency averages
    const prevAvg = this.metrics.avgLatencyByProvider[provider.id] || 0;
    const prevCount = (this.metrics.requestsByProvider[provider.id] || 1) - 1;
    this.metrics.avgLatencyByProvider[provider.id] = prevCount > 0
      ? (prevAvg * prevCount + decision.latencyEstimate) / (prevCount + 1)
      : decision.latencyEstimate;

    // Rate limit tracking
    const minuteKey = `${provider.id}:${Math.floor(Date.now() / 60000)}`;
    this.requestCountByMinute[minuteKey] = (this.requestCountByMinute[minuteKey] || 0) + 1;

    // Clean old minute keys
    const currentMinute = Math.floor(Date.now() / 60000);
    for (const key of Object.keys(this.requestCountByMinute)) {
      const keyMinute = parseInt(key.split(':')[1], 10);
      if (currentMinute - keyMinute > 5) delete this.requestCountByMinute[key];
    }

    // Track local vs cloud
    if (provider.id === 'ollama') {
      this.metrics.localRoutedCount++;
    }

    // Estimate what it would have cost on cloud-only (use groq 8b as baseline)
    const cloudCost = (0.05 * inputK) + (0.08 * outputK);
    this.metrics.cloudOnlyCostEstimate += cloudCost;

    // Keep recent decisions (last 50)
    this.recentDecisions.push(decision);
    if (this.recentDecisions.length > 50) {
      this.recentDecisions = this.recentDecisions.slice(-50);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  getConfig(): ProviderConfig[] {
    return this.providers;
  }

  getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  getRecentDecisions(limit = 20): RouteDecision[] {
    return this.recentDecisions.slice(-limit);
  }

  updateProvider(providerId: string, updates: { enabled?: boolean; priority?: number }): boolean {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return false;
    if (updates.enabled !== undefined) provider.enabled = updates.enabled;
    if (updates.priority !== undefined) provider.priority = updates.priority;
    return true;
  }

  /** Simulate a failure for a provider (for demo drama) */
  simulateFailure(providerId: string): void {
    this.metrics.failuresByProvider[providerId] = (this.metrics.failuresByProvider[providerId] || 0) + 1;
  }
}
