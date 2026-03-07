import { describe, it, expect, beforeEach } from "vitest";
import { ModelRouter, type ProviderConfig, type RouteRequest } from "./model-router.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const minimalProviders: ProviderConfig[] = [
  {
    id: "local",
    name: "Local",
    baseUrl: "http://localhost:11434",
    models: [
      {
        id: "small-model",
        name: "Small",
        costPer1kInput: 0,
        costPer1kOutput: 0,
        contextWindow: 4096,
        capabilities: ["chat"],
        maxTokens: 1024,
      },
    ],
    enabled: true,
    priority: 1,
  },
  {
    id: "cloud",
    name: "Cloud",
    baseUrl: "https://api.cloud.com",
    models: [
      {
        id: "big-model",
        name: "Big",
        costPer1kInput: 5.0,
        costPer1kOutput: 10.0,
        contextWindow: 128000,
        capabilities: ["chat", "function-calling"],
        maxTokens: 8192,
      },
    ],
    enabled: true,
    priority: 2,
  },
];

function req(overrides: Partial<RouteRequest> = {}): RouteRequest {
  return { agentLevel: 4, taskType: "simple", preferLocal: false, ...overrides };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ModelRouter – constructor", () => {
  it("uses default providers when none supplied", () => {
    const router = new ModelRouter();
    const config = router.getConfig();
    expect(config.length).toBeGreaterThanOrEqual(3);
    expect(config.map((p) => p.id)).toContain("ollama");
  });

  it("deep-copies provided providers", () => {
    const providers = JSON.parse(JSON.stringify(minimalProviders));
    const router = new ModelRouter(providers);
    providers[0].enabled = false;
    // router should still have it enabled
    expect(router.getConfig()[0].enabled).toBe(true);
  });
});

describe("ModelRouter – route by agent level", () => {
  it("L1-6 workers route to cheapest provider", () => {
    const router = new ModelRouter(minimalProviders);
    const decision = router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(decision.provider).toBe("local");
  });

  it("L9+ executives route to premium provider", () => {
    // Create providers with openrouter and claude model
    const providers: ProviderConfig[] = [
      { ...minimalProviders[0] },
      {
        id: "openrouter",
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai",
        models: [
          {
            id: "anthropic/claude-3.5-sonnet",
            name: "Claude",
            costPer1kInput: 3,
            costPer1kOutput: 15,
            contextWindow: 200000,
            capabilities: ["chat"],
            maxTokens: 8192,
          },
        ],
        enabled: true,
        priority: 3,
      },
    ];
    const router = new ModelRouter(providers);
    const decision = router.route(req({ agentLevel: 10 }));
    expect(decision.provider).toBe("openrouter");
    expect(decision.model).toContain("claude");
  });

  it("L7-8 leads route to groq 70b when available", () => {
    const providers: ProviderConfig[] = [
      { ...minimalProviders[0] },
      {
        id: "groq",
        name: "Groq",
        baseUrl: "https://api.groq.com",
        models: [
          {
            id: "llama-3.1-8b-instant",
            name: "8B",
            costPer1kInput: 0.05,
            costPer1kOutput: 0.08,
            contextWindow: 131072,
            capabilities: ["chat"],
            maxTokens: 8192,
          },
          {
            id: "llama-3.1-70b-versatile",
            name: "70B",
            costPer1kInput: 0.59,
            costPer1kOutput: 0.79,
            contextWindow: 131072,
            capabilities: ["chat"],
            maxTokens: 8192,
          },
        ],
        rateLimit: { rpm: 30, tpm: 6000 },
        enabled: true,
        priority: 2,
      },
    ];
    const router = new ModelRouter(providers);
    const decision = router.route(req({ agentLevel: 7 }));
    expect(decision.provider).toBe("groq");
    expect(decision.model).toContain("70b");
  });
});

describe("ModelRouter – no providers enabled", () => {
  it("returns none/none when all providers disabled", () => {
    const providers = minimalProviders.map((p) => ({
      ...p,
      enabled: false,
      models: [...p.models],
    }));
    const router = new ModelRouter(providers);
    const decision = router.route(req());
    expect(decision.provider).toBe("none");
    expect(decision.model).toBe("none");
    expect(decision.reason).toContain("No providers enabled");
  });
});

describe("ModelRouter – fallback chain", () => {
  it("includes other providers in fallback chain", () => {
    const router = new ModelRouter(minimalProviders);
    const decision = router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(decision.fallbackChain.length).toBeGreaterThan(0);
    expect(decision.fallbackChain.some((f) => f.startsWith("cloud/"))).toBe(true);
  });
});

describe("ModelRouter – metrics", () => {
  it("starts with zero metrics", () => {
    const router = new ModelRouter(minimalProviders);
    const m = router.getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.totalCost).toBe(0);
  });

  it("tracks requests after routing", () => {
    const router = new ModelRouter(minimalProviders);
    router.route(req({ agentLevel: 3, preferLocal: true }));
    router.route(req({ agentLevel: 3, preferLocal: true }));
    const m = router.getMetrics();
    expect(m.totalRequests).toBe(2);
  });

  it("tracks cost for cloud providers", () => {
    const providers: ProviderConfig[] = [
      {
        id: "openrouter",
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai",
        models: [
          {
            id: "anthropic/claude-3.5-sonnet",
            name: "Claude",
            costPer1kInput: 3,
            costPer1kOutput: 15,
            contextWindow: 200000,
            capabilities: ["chat"],
            maxTokens: 8192,
          },
        ],
        enabled: true,
        priority: 1,
      },
    ];
    const router = new ModelRouter(providers);
    router.route(req({ agentLevel: 10 }));
    const m = router.getMetrics();
    expect(m.totalCost).toBeGreaterThan(0);
  });

  it("tracks local routed count", () => {
    const providers: ProviderConfig[] = [
      {
        id: "ollama",
        name: "Ollama",
        baseUrl: "http://localhost:11434",
        models: [
          {
            id: "qwen2.5:7b",
            name: "Qwen",
            costPer1kInput: 0,
            costPer1kOutput: 0,
            contextWindow: 32768,
            capabilities: ["chat"],
            maxTokens: 4096,
          },
        ],
        enabled: true,
        priority: 1,
      },
    ];
    const router = new ModelRouter(providers);
    router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(router.getMetrics().localRoutedCount).toBe(1);
  });
});

describe("ModelRouter – recent decisions", () => {
  it("stores recent decisions", () => {
    const router = new ModelRouter(minimalProviders);
    router.route(req({ agentLevel: 3, preferLocal: true }));
    const decisions = router.getRecentDecisions();
    expect(decisions).toHaveLength(1);
    expect(decisions[0].taskType).toBe("simple");
  });

  it("limits to requested count", () => {
    const router = new ModelRouter(minimalProviders);
    for (let i = 0; i < 10; i++) router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(router.getRecentDecisions(3)).toHaveLength(3);
  });

  it("caps at 50 decisions", () => {
    const router = new ModelRouter(minimalProviders);
    for (let i = 0; i < 60; i++) router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(router.getRecentDecisions(100).length).toBeLessThanOrEqual(50);
  });
});

describe("ModelRouter – updateProvider", () => {
  it("disables a provider", () => {
    const router = new ModelRouter(minimalProviders);
    expect(router.updateProvider("local", { enabled: false })).toBe(true);
    expect(router.getConfig().find((p) => p.id === "local")!.enabled).toBe(false);
  });

  it("changes priority", () => {
    const router = new ModelRouter(minimalProviders);
    router.updateProvider("cloud", { priority: 0 });
    expect(router.getConfig().find((p) => p.id === "cloud")!.priority).toBe(0);
  });

  it("returns false for unknown provider", () => {
    const router = new ModelRouter(minimalProviders);
    expect(router.updateProvider("nonexistent", { enabled: false })).toBe(false);
  });
});

describe("ModelRouter – simulateFailure", () => {
  it("increments failure counter", () => {
    const router = new ModelRouter(minimalProviders);
    router.simulateFailure("local");
    router.simulateFailure("local");
    expect(router.getMetrics().failuresByProvider["local"]).toBe(2);
  });
});

describe("ModelRouter – route decision fields", () => {
  it("includes agentId and taskType", () => {
    const router = new ModelRouter(minimalProviders);
    const decision = router.route(
      req({ agentId: "agent-42", agentLevel: 3, taskType: "coding", preferLocal: true }),
    );
    expect(decision.agentId).toBe("agent-42");
    expect(decision.taskType).toBe("coding");
  });

  it("includes timestamp", () => {
    const router = new ModelRouter(minimalProviders);
    const before = Date.now();
    const decision = router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(decision.timestamp).toBeGreaterThanOrEqual(before);
  });

  it("includes latency estimate", () => {
    const router = new ModelRouter(minimalProviders);
    const decision = router.route(req({ agentLevel: 3, preferLocal: true }));
    expect(decision.latencyEstimate).toBeGreaterThan(0);
  });
});

describe("ModelRouter – estimated cost by task type", () => {
  it("analysis tasks have higher input tokens", () => {
    const providers: ProviderConfig[] = [
      {
        id: "openrouter",
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai",
        models: [
          {
            id: "anthropic/claude-3.5-sonnet",
            name: "Claude",
            costPer1kInput: 3,
            costPer1kOutput: 15,
            contextWindow: 200000,
            capabilities: ["chat"],
            maxTokens: 8192,
          },
        ],
        enabled: true,
        priority: 1,
      },
    ];
    const router1 = new ModelRouter(providers);
    const analysis = router1.route(req({ agentLevel: 10, taskType: "analysis" }));

    const router2 = new ModelRouter(JSON.parse(JSON.stringify(providers)));
    const simple = router2.route(req({ agentLevel: 10, taskType: "simple" }));

    expect(analysis.estimatedCost).toBeGreaterThan(simple.estimatedCost);
  });
});
