import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLLMConfig, type LLMConfig } from "./llm-provider.js";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getLLMConfig – defaults", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all LLM-related env vars
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MAX_TOKENS;
    delete process.env.LLM_TEMPERATURE;
    delete process.env.LLM_TIMEOUT_MS;
    delete process.env.LLM_RATE_LIMIT_RPM;
    delete process.env.LLM_MAX_RETRIES;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    // Restore
    Object.assign(process.env, originalEnv);
  });

  it("defaults to ollama provider", () => {
    const config = getLLMConfig();
    expect(config.provider).toBe("ollama");
  });

  it("defaults to qwen model for ollama", () => {
    const config = getLLMConfig();
    expect(config.model).toContain("qwen");
  });

  it("defaults to localhost for ollama", () => {
    const config = getLLMConfig();
    expect(config.baseUrl).toContain("localhost:11434");
  });

  it("defaults maxTokens to 200", () => {
    const config = getLLMConfig();
    expect(config.maxTokens).toBe(200);
  });

  it("defaults temperature to 0.5", () => {
    const config = getLLMConfig();
    expect(config.temperature).toBe(0.5);
  });

  it("defaults maxRetries to 3", () => {
    const config = getLLMConfig();
    expect(config.maxRetries).toBe(3);
  });

  it("ollama timeout defaults to 10000", () => {
    const config = getLLMConfig();
    expect(config.timeoutMs).toBe(10000);
  });
});

describe("getLLMConfig – anthropic provider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LLM_MODEL;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_TIMEOUT_MS;
    process.env.LLM_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it("uses anthropic defaults", () => {
    const config = getLLMConfig();
    expect(config.provider).toBe("anthropic");
    expect(config.model).toContain("claude");
    expect(config.baseUrl).toContain("anthropic.com");
  });

  it("cloud timeout defaults to 30000", () => {
    const config = getLLMConfig();
    expect(config.timeoutMs).toBe(30000);
  });

  it("reads ANTHROPIC_API_KEY", () => {
    const config = getLLMConfig();
    expect(config.apiKey).toBe("test-key");
  });
});

describe("getLLMConfig – env overrides", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.LLM_PROVIDER = "ollama";
    process.env.LLM_MODEL = "custom-model";
    process.env.LLM_BASE_URL = "http://custom:1234";
    process.env.LLM_MAX_TOKENS = "500";
    process.env.LLM_TEMPERATURE = "0.9";
    process.env.LLM_TIMEOUT_MS = "5000";
    process.env.LLM_MAX_RETRIES = "5";
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it("respects LLM_MODEL", () => {
    expect(getLLMConfig().model).toBe("custom-model");
  });

  it("respects LLM_BASE_URL", () => {
    expect(getLLMConfig().baseUrl).toBe("http://custom:1234");
  });

  it("respects LLM_MAX_TOKENS", () => {
    expect(getLLMConfig().maxTokens).toBe(500);
  });

  it("respects LLM_TEMPERATURE", () => {
    expect(getLLMConfig().temperature).toBe(0.9);
  });

  it("respects LLM_TIMEOUT_MS", () => {
    expect(getLLMConfig().timeoutMs).toBe(5000);
  });

  it("respects LLM_MAX_RETRIES", () => {
    expect(getLLMConfig().maxRetries).toBe(5);
  });
});

describe("getLLMConfig – API key resolution", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LLM_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it("returns empty string when no keys set", () => {
    expect(getLLMConfig().apiKey).toBe("");
  });

  it("prefers LLM_API_KEY over provider-specific keys", () => {
    process.env.LLM_API_KEY = "generic-key";
    process.env.ANTHROPIC_API_KEY = "anthropic-key";
    expect(getLLMConfig().apiKey).toBe("generic-key");
  });

  it("falls back to GROQ_API_KEY", () => {
    process.env.GROQ_API_KEY = "groq-key";
    expect(getLLMConfig().apiKey).toBe("groq-key");
  });
});
