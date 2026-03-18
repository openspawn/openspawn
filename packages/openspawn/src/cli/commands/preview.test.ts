import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildPreviewEnv, findSandboxDir, findWorkspaceRoot } from "./preview.js";
import { defaultConfig } from "../../core/config.js";
import { LlmProvider } from "../../core/types.js";
import type { OpenSpawnConfig } from "../../core/types.js";
import type { PreviewFlags } from "./preview.js";

function defaultFlags(overrides: Partial<PreviewFlags> = {}): PreviewFlags {
  return {
    port: 3333,
    open: true,
    mode: "deterministic",
    scenario: "warm-up",
    verbose: false,
    ...overrides,
  };
}

describe("buildPreviewEnv", () => {
  const savedEnv = process.env;

  beforeEach(() => {
    process.env = { ...savedEnv };
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it("sets correct env for Anthropic provider", () => {
    const env = buildPreviewEnv(defaultConfig, defaultFlags());
    expect(env.LLM_PROVIDER).toBe("anthropic");
    expect(env.SANDBOX_MODEL).toBe(defaultConfig.llm.models.default);
    expect(env.SERVE_DASHBOARD).toBe("1");
    expect(env.SIMULATION_MODE).toBe("deterministic");
    expect(env.SCENARIO).toBe("warm-up");
    expect(env.CLEAN).toBe("1");
  });

  it("sets correct env for Groq provider", () => {
    const config: OpenSpawnConfig = {
      ...defaultConfig,
      llm: {
        ...defaultConfig.llm,
        provider: LlmProvider.Groq,
        models: { default: "llama-3.3-70b", senior: "llama-3.3-70b" },
      },
    };
    const env = buildPreviewEnv(config, defaultFlags());
    expect(env.LLM_PROVIDER).toBe("groq");
    expect(env.GROQ_MODEL).toBe("llama-3.3-70b");
  });

  it("sets correct env for OpenRouter provider", () => {
    const config: OpenSpawnConfig = {
      ...defaultConfig,
      llm: {
        ...defaultConfig.llm,
        provider: LlmProvider.OpenRouter,
        models: { default: "meta-llama/llama-3-8b", senior: "meta-llama/llama-3-70b" },
      },
    };
    const env = buildPreviewEnv(config, defaultFlags());
    expect(env.LLM_PROVIDER).toBe("openrouter");
    expect(env.OPENROUTER_MODEL).toBe("meta-llama/llama-3-8b");
  });

  it("sets correct env for Ollama provider", () => {
    const config: OpenSpawnConfig = {
      ...defaultConfig,
      llm: {
        ...defaultConfig.llm,
        provider: LlmProvider.Ollama,
        models: { default: "qwen3:0.6b", senior: "qwen3:0.6b" },
      },
    };
    const env = buildPreviewEnv(config, defaultFlags());
    expect(env.LLM_PROVIDER).toBe("ollama");
    expect(env.SANDBOX_MODEL).toBe("qwen3:0.6b");
  });

  it("applies port override from flags", () => {
    const env = buildPreviewEnv(defaultConfig, defaultFlags({ port: 4000 }));
    expect(env.SANDBOX_PORT).toBe("4000");
  });

  it("applies verbose flag", () => {
    const env = buildPreviewEnv(defaultConfig, defaultFlags({ verbose: true }));
    expect(env.VERBOSE).toBe("1");
  });

  it("passes through API keys from process.env", () => {
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

    const env = buildPreviewEnv(defaultConfig, defaultFlags());
    expect(env.GROQ_API_KEY).toBe("test-groq-key");
    expect(env.ANTHROPIC_API_KEY).toBe("test-anthropic-key");
  });

  it("omits API keys not present in process.env", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const env = buildPreviewEnv(defaultConfig, defaultFlags());
    expect(env.GROQ_API_KEY).toBeUndefined();
    expect(env.OPENROUTER_API_KEY).toBeUndefined();
  });
});

describe("findSandboxDir", () => {
  it("returns a path when in monorepo", () => {
    const result = findSandboxDir();
    // In the monorepo this should resolve
    expect(result).toBeDefined();
    expect(result).toContain("tools/sandbox");
  });
});

describe("findWorkspaceRoot", () => {
  it("returns two levels up from sandbox dir", () => {
    const root = findWorkspaceRoot("/some/project/tools/sandbox");
    expect(root).toBe("/some/project");
  });
});
