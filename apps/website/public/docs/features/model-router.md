---
source: https://openspawn.ai/docs/features/model-router
generated: 2026-03-03
---

# Model Router

## Overview

## Routing Tiers

## Fallback Chains

```
L7-8: Groq (70B) → OpenRouter → Ollama
```

## Providers

### Ollama (Local)

Smart LLM routing across Ollama, Groq, and OpenRouter with automatic fallbacks and cost tracking. Not every agent needs GPT-4. A Level 3 worker writing unit tests uses a local 7B model. A Level 10 executive making strategic decisions gets Claude 3.5 Sonnet.

### Groq

$0 cost, 40–150ms latency. Runs Qwen 2.5 7B on your hardware. Best for L1–L6 workers.

### OpenRouter

$0.05–$0.79/1K tokens, 80–300ms latency. Llama 3.1 8B/70B. Best for L7–L8 leads.

## Metrics

$2.50–$15/1K tokens, 200–800ms. Claude 3.5 Sonnet, GPT-4o. Best for L9–L10 executives.
