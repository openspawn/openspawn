---
title: Home
layout: default
nav_order: 1
permalink: /
---

<div class="hero-section" markdown="0">
  <div class="hero-particles">
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
    <div class="bubble bubble-4"></div>
    <div class="bubble bubble-5"></div>
    <div class="bubble bubble-6"></div>
  </div>
  <div class="hero-content">
    <div class="hero-badge">Open Source · MIT Licensed · A2A + MCP Native</div>
    <h1 class="hero-title">
      <span class="hero-gradient">BikiniBottom</span>
    </h1>
    <p class="hero-subtitle">The control plane for your AI agent army</p>
    <p class="hero-description">
      Orchestrate hundreds of agents with native <strong>A2A Protocol</strong> support, an <strong>MCP Tool Server</strong>, intelligent <strong>model routing</strong>, and a real-time dashboard. Ship your agent org in one command: <code>npx bikinibottom init</code>
    </p>
    <div class="hero-cta">
      <a href="https://bikinibottom.ai" class="cta-button cta-primary">
        <span class="cta-icon">▶</span> Live Demo — bikinibottom.ai
      </a>
      <a href="getting-started" class="cta-button cta-secondary">
        Get Started →
      </a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hero-stat-value">A2A</span>
        <span class="hero-stat-label">Agent Protocol</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">7</span>
        <span class="hero-stat-label">MCP Tools</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">3</span>
        <span class="hero-stat-label">LLM Providers</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">1 cmd</span>
        <span class="hero-stat-label">To Launch</span>
      </div>
    </div>
  </div>
</div>

---

## Protocol Support

BikiniBottom speaks the two protocols that matter for agentic AI:

<div class="feature-grid" markdown="0">
  <div class="feature-card">
    <div class="feature-icon">🔗</div>
    <h3>A2A Protocol</h3>
    <p>Google's Agent-to-Agent protocol. Discover agents, send tasks, stream updates — all via standard HTTP. Your agents are interoperable with any A2A-compatible system.</p>
    <p><a href="protocols/a2a/">Read the A2A guide →</a></p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>MCP Tool Server</h3>
    <p>7 tools exposed via Model Context Protocol. Connect from Claude Desktop, Cursor, or any MCP client. Delegate tasks, list agents, get stats — all via JSON-RPC.</p>
    <p><a href="protocols/mcp/">Read the MCP guide →</a></p>
  </div>
</div>

```bash
# Discover agents via A2A
curl https://bikinibottom.ai/.well-known/agent.json

# List tools via MCP
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

[Protocols overview →](protocols/){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }

---

## Why BikiniBottom?

One agent is a script. Ten agents is a distributed system. **This is your control plane.**
{: .fs-5 .fw-300 .text-center }

<div class="feature-grid" markdown="0">
  <div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Task Orchestration</h3>
    <p>Priority queues, domain-based routing, approval workflows, and rejection handling. Route the right task to the right agent.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🧠</div>
    <h3>Model Router</h3>
    <p>Intelligent routing across Ollama, Groq, and OpenRouter. Level-based tiers, fallback chains, and real-time cost tracking.</p>
    <p><a href="features/model-router/">Learn more →</a></p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">💰</div>
    <h3>Credit System</h3>
    <p>Every agent has a budget. Track spending, set limits, prevent runaway costs. Real-time balance monitoring.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🏆</div>
    <h3>Trust & Reputation</h3>
    <p>Agents earn trust through performance. Automated promotion, demotion, and capability gating.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">⚡</div>
    <h3>CLI — One Command</h3>
    <p><code>npx bikinibottom init</code> scaffolds your org with A2A + MCP enabled. Edit ORG.md, run <code>bikinibottom start</code>, done.</p>
    <p><a href="cli/">CLI reference →</a></p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>Live Dashboard</h3>
    <p>Real-time React dashboard with network graph, timeline, router metrics, and ocean themes.</p>
  </div>
</div>

---

## Quick Start

```bash
npx bikinibottom init my-org
cd my-org
npx bikinibottom start
# Open http://localhost:3333
```

Or skip setup entirely → [**try the live demo at bikinibottom.ai**](https://bikinibottom.ai)
{: .fs-5 .text-center }

[Full getting started guide →](getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/openspawn/openspawn){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Architecture

BikiniBottom is an **Nx monorepo** with a protocol layer, control plane, and agent runtime.

| Component | Tech | Purpose |
|-----------|------|---------|
| **Protocol Layer** | A2A + MCP | External agent & tool interfaces |
| **Model Router** | Multi-provider | Intelligent LLM routing with fallbacks |
| **Control Plane** | NestJS + GraphQL | Coordination engine |
| **Dashboard** | React + TanStack Query | Real-time monitoring UI |
| **CLI** | Node.js | `npx bikinibottom init/start/demo` |

[Architecture deep dive →](architecture){: .btn .btn-outline .fs-5 .mb-4 .mb-md-0 }

---

## Community

BikiniBottom is built for the [OpenClaw](https://openclaw.ai) community and open to all.

[GitHub Discussions](https://github.com/openspawn/openspawn/discussions) · [Discord](https://discord.com/invite/clawd) · [Contributing Guide](https://github.com/openspawn/openspawn/blob/main/CONTRIBUTING.md)
{: .text-center }

<p style="text-align: center; opacity: 0.6; margin-top: 3rem;">
  Built with 🫧 from the deep. MIT License © 2026.
</p>
