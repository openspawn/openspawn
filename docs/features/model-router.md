---
title: Model Router
layout: default
parent: Features
nav_order: 1
permalink: /features/model-router/
---

# Model Router
{: .no_toc }

BikiniBottom's model router intelligently routes LLM requests across providers based on agent level, task type, cost constraints, and availability — with automatic fallback chains.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Overview

Not every agent needs GPT-4. A Level 3 worker writing unit tests can use a local 7B model. A Level 10 executive making strategic decisions needs Claude 3.5 Sonnet.

The model router makes this automatic:

```
Agent Level → Tier Selection → Provider → Model → Fallback if needed
```

---

## Routing Tiers

| Agent Level | Tier | Default Provider | Model | Cost |
|-------------|------|-------------------|-------|------|
| L9–L10 | Executive | OpenRouter | Claude 3.5 Sonnet, GPT-4o | $$$ |
| L7–L8 | Lead | Groq | Llama 3.1 70B | $ |
| L1–L6 | Worker | Ollama (local) | Qwen 2.5 7B | Free |

The router picks the **cheapest capable model** for each request while respecting quality requirements.

---

## Providers

### Ollama (Local)

- **Cost:** $0 — runs on your hardware
- **Latency:** 40–150ms
- **Models:** Qwen 2.5 7B (32K context)
- **Best for:** L1–L6 workers, high-volume simple tasks

### Groq

- **Cost:** $0.05–$0.79 per 1K tokens
- **Latency:** 80–300ms
- **Models:** Llama 3.1 8B (fast), Llama 3.1 70B (capable)
- **Rate limits:** 30 RPM, 6K TPM
- **Best for:** L7–L8 leads, tasks needing function calling

### OpenRouter

- **Cost:** $2.50–$15.00 per 1K tokens
- **Latency:** 200–800ms
- **Models:** Claude 3.5 Sonnet (200K context), GPT-4o (128K context)
- **Best for:** L9–L10 executives, complex reasoning, strategic decisions

---

## Fallback Chains

When a provider is unavailable or rate-limited, the router automatically falls back:

```
L9-10 Request:
  OpenRouter (Claude 3.5 Sonnet)
    ↓ unavailable?
  Groq (Llama 3.1 70B)
    ↓ rate-limited?
  Ollama (Qwen 2.5 7B)

L7-8 Request:
  Groq (Llama 3.1 70B)
    ↓ rate-limited?
  OpenRouter (GPT-4o)
    ↓ unavailable?
  Ollama (Qwen 2.5 7B)

L1-6 Request:
  Ollama (Qwen 2.5 7B)  [60% of requests]
  Groq (Llama 3.1 8B)   [40% of requests]
    ↓ both unavailable?
  OpenRouter (cheapest available)
```

Every fallback is tracked in metrics so you can see how often providers fail.

---

## Cost Tracking

The router tracks costs in real-time per agent and per provider:

| Metric | Description |
|--------|-------------|
| `totalRequests` | Total routing decisions made |
| `totalCost` | Total estimated cost across all providers |
| `requestsByProvider` | Request count per provider |
| `costByProvider` | Cost breakdown per provider |
| `avgLatencyByProvider` | Average latency per provider |
| `failuresByProvider` | Failure count per provider |
| `fallbacksTriggered` | How often fallbacks were needed |
| `localRoutedCount` | Requests handled locally ($0) |
| `cloudOnlyCostEstimate` | What it would cost without local routing |

### Cost Savings

The `cloudOnlyCostEstimate` metric shows what you'd pay if everything went to cloud providers. Compare it with `totalCost` to see your savings from local routing:

```
Cloud-only estimate: $47.82
Actual cost:         $12.15
Saved:               $35.67 (74%)
```

---

## Configuration

In `bikinibottom.config.json`:

```json
{
  "router": {
    "preferLocal": true,
    "providers": ["ollama", "groq", "openrouter"]
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `preferLocal` | Route L1–L6 to Ollama when available | `true` |
| `providers` | Enabled providers (order = fallback priority) | `["ollama", "groq"]` |

### Environment Variables

```bash
GROQ_API_KEY=gsk_...          # Required for Groq
OPENROUTER_API_KEY=sk-or-...  # Required for OpenRouter
OLLAMA_BASE_URL=http://localhost:11434  # Custom Ollama URL
```

---

## Router API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/router/metrics` | GET | Current router metrics |
| `/api/router/config` | GET | Provider configuration |
| `/api/router/decisions` | GET | Recent routing decisions |

### Example: Get Metrics

```bash
curl http://localhost:3333/api/router/metrics
```

```json
{
  "totalRequests": 1247,
  "totalCost": 12.15,
  "requestsByProvider": {
    "ollama": 748,
    "groq": 412,
    "openrouter": 87
  },
  "costByProvider": {
    "ollama": 0,
    "groq": 4.23,
    "openrouter": 7.92
  },
  "fallbacksTriggered": 23,
  "localRoutedCount": 748,
  "cloudOnlyCostEstimate": 47.82
}
```

---

## Dashboard

The router page in the dashboard shows:

- **Provider status** — Which providers are online, rate limit usage
- **Cost breakdown** — Pie chart by provider, cumulative cost over time
- **Routing decisions** — Live feed of routing decisions with reasons
- **Latency distribution** — Histogram per provider
- **Savings calculator** — Local vs cloud cost comparison
