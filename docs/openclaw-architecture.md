# OpenClaw Architecture & Deployment Plan

**Author:** Adam (CEO) + Claude (Architect)
**Date:** February 5, 2026
**Status:** Planning — Pre-Hardware Acquisition
**Version:** 0.1.0

---

## Table of Contents

1. [Vision & Operating Model](#1-vision--operating-model)
2. [Hardware Specification](#2-hardware-specification)
3. [Network Architecture](#3-network-architecture)
4. [OpenClaw Installation & Configuration](#4-openclaw-installation--configuration)
5. [LLM Stack & Model Routing](#5-llm-stack--model-routing)
6. [Local Model Infrastructure (Ollama)](#6-local-model-infrastructure-ollama)
7. [Channel Configuration](#7-channel-configuration)
8. [Security & Credential Management](#8-security--credential-management)
9. [Deployment Infrastructure (Hetzner + Coolify)](#9-deployment-infrastructure-hetzner--coolify)
10. [Multi-Agent Organization Architecture](#10-multi-agent-organization-architecture)
11. [Credit Economy & Incentive System](#11-credit-economy--incentive-system)
12. [Revenue Streams & Strategy](#12-revenue-streams--strategy)
13. [Personal Tasks & Monitoring](#13-personal-tasks--monitoring)
14. [Git & Code Workflow](#14-git--code-workflow)
15. [Financial Infrastructure](#15-financial-infrastructure)
16. [Phased Rollout Plan](#16-phased-rollout-plan)
17. [Operations & Maintenance](#17-operations--maintenance)
18. [Risk Register](#18-risk-register)
19. [Cost Projections](#19-cost-projections)
20. [Open Questions & Decisions](#20-open-questions--decisions)

---

## 1. Vision & Operating Model

### The Vision

An always-on, autonomous AI organization running on dedicated hardware, capable of building software products, generating revenue, managing its own finances, and scaling its capabilities over time — all under the strategic direction of a human CEO (Adam).

### Operating Model

Adam operates as **CEO**: setting high-level strategy, mission, and vision. Approving major expenditures. Reviewing agent performance. Hiring (spinning up new agents), firing (decommissioning underperformers), and promoting (upgrading capabilities). Day-to-day execution is fully delegated to the agent organization.

The agent organization's wealth is Adam's wealth — no separation. The agents manage a shared financial pool (prepaid card with API access) and are incentivized via an internal credit economy to maximize revenue and minimize waste.

### Core Principles

- **Start small, scale deliberately.** One agent wearing all hats → specialized roles as bottlenecks emerge.
- **Autonomy within guardrails.** Agents can act independently up to defined spending and risk thresholds.
- **Feature branches, Adam merges.** All code goes through human review before hitting main/production.
- **Sandboxed identity.** The agent org has its own email, accounts, and credentials — fully separated from Adam's personal identity.
- **Self-sufficiency.** The system should function even when cloud APIs are rate-limited or unavailable, via local model fallback.

---

## 2. Hardware Specification

### Mac Mini M4 Pro — Recommended Configuration

| Component | Spec | Rationale |
|-----------|------|-----------|
| **SoC** | M4 Pro, 14-core CPU / 20-core GPU | Extra 2 CPU cores over base help with concurrent workloads (gateway + browser automation + Ollama serving). GPU cores assist with local model inference. |
| **Unified Memory** | 48GB | Critical for local model inference. Supports a quantized 70B model (~40GB) with headroom for gateway + browser. 24GB would limit you to ~14B models. |
| **Storage** | 1TB SSD | Model weights (30-50GB each for several models), agent workspaces, browser profiles, session history, git repos. 512GB would be tight. |
| **Networking** | Built-in Gigabit Ethernet + Wi-Fi 6E | Use wired Ethernet for reliability on an always-on machine. |

**Estimated cost:** ~$2,199–$2,399 CAD

### Physical Setup

- Place in a well-ventilated location (closet, home office shelf, etc.)
- Connect via Ethernet to router (not Wi-Fi) for reliability
- Connect to UPS/surge protector — this is an always-on server now
- No monitor/keyboard needed after initial setup (headless operation via SSH + Tailscale)
- Enable "Start up automatically after power failure" in System Preferences → Energy
- Disable sleep entirely: `sudo pmset -a sleep 0 displaysleep 0 disksleep 0`
- Consider a small USB-C Ethernet adapter as backup if the built-in port ever has issues

---

## 3. Network Architecture

### Tailscale Mesh — Zero Public Ports

Since Tailscale is already deployed across your devices, the Mac Mini joins your existing tailnet. No ports are exposed to the public internet.

```
┌─────────────────────────────────────────────────────┐
│                  Tailscale Mesh (Tailnet)            │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │ MacBook  │   │ iPhone   │   │ Mac Mini M4 Pro│  │
│  │ (laptop) │   │          │   │ (OpenClaw host)│  │
│  │          │   │ Telegram │   │                │  │
│  │ SSH      │   │ Discord  │   │ Gateway :18789 │  │
│  │ WebChat  │   │ iOS App  │   │ Browser :18791 │  │
│  └──────────┘   └──────────┘   │ Ollama  :11434 │  │
│                                │ SSH     :22    │  │
│  ┌──────────────────────┐      └────────────────┘  │
│  │ Hetzner VPS          │                           │
│  │ (Coolify / deploys)  │                           │
│  │ Tailscale connected  │                           │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Access Patterns

| From | To | Method |
|------|----|--------|
| MacBook → Mac Mini | SSH, WebChat UI, Gateway admin | `ssh adam@<tailscale-ip>` or Tailscale SSH |
| iPhone → Mac Mini | Telegram/Discord (via internet to platform, then to gateway), WebChat via Tailscale | Tailscale app on iOS provides direct access |
| Mac Mini → Hetzner VPS | SSH for deployments, Coolify API | Via Tailscale tunnel, no public ports on VPS either |
| Mac Mini → Internet | Outbound only — API calls, browsing, messaging platforms | Standard outbound, no inbound exposure |

### Gateway Binding Configuration

```json
// In ~/.openclaw/openclaw.json
{
  "gateway": {
    "bind": "tailnet",
    "port": 18789,
    "auth": {
      "allowTailscale": true
    }
  }
}
```

Using `tailnet` binding means the gateway only listens on the Tailscale interface. `allowTailscale: true` means Tailscale identity headers satisfy authentication automatically — no tokens to manage for access from your own devices.

### Tailscale Serve for Control UI

The Control UI requires HTTPS (WebCrypto). Tailscale Serve provides this natively:

```bash
# Serve the gateway over HTTPS on your tailnet
tailscale serve --bg https+insecure://127.0.0.1:18789

# Access from any device on your tailnet:
# https://mac-mini.<tailnet-name>.ts.net/
```

This gives you a clean HTTPS URL that works from both your MacBook browser and iPhone Safari.

---

## 4. OpenClaw Installation & Configuration

### Prerequisites (on Mac Mini)

```bash
# Install Homebrew (if not present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 22+
brew install node@22

# Verify
node --version  # Should be v22.x.x

# Install Git (likely already present on macOS, but ensure latest)
brew install git
```

### Installation — Hackable (Git) Method

The docs recommend the git install for power users who want to read source and extend. Given your ambitions, this is the right call.

```bash
# Clone the repo
git clone https://github.com/openclaw/openclaw.git ~/openclaw-source
cd ~/openclaw-source

# Install globally from source
npm install -g .

# Verify
openclaw --version
```

### Onboarding Wizard

```bash
openclaw onboard
```

The wizard walks through:

1. **Gateway mode:** Select `Local` — the gateway runs on this Mac Mini.
2. **Auth/model provider:** Select `setup-token` → run `claude setup-token` in another terminal, paste the result. (See Section 5 for the full LLM stack configuration.)
3. **Channels:** Configure Telegram + Discord (see Section 7).
4. **Skills:** Start selective — we'll configure these deliberately (see Section 10).
5. **Hooks:** Skip for now, configure later.
6. **Daemon:** Select `Yes` — installs as a macOS LaunchAgent for always-on operation.

### Post-Onboard Verification

```bash
openclaw status          # Gateway health
openclaw models status   # Model provider connectivity
openclaw channels status # Channel connectivity
openclaw doctor          # Security audit
```

### Key Configuration Files

```
~/.openclaw/
├── openclaw.json          # Main configuration (gateway, models, agents)
├── credentials/           # OAuth tokens, API keys
│   ├── anthropic.default.json
│   └── openrouter.default.json
├── agents/
│   └── main/
│       └── sessions/      # Conversation history (JSONL)
├── channels/
│   ├── telegram/
│   └── discord/
└── workspace/             # Agent working directory
    ├── SOUL.md            # Agent personality & boundaries
    ├── USER.md            # What the agent knows about you
    ├── MEMORY.md          # Persistent memory
    └── memory/
        └── snippets.md    # Long-term knowledge
```

---

## 5. LLM Stack & Model Routing

### Three-Tier Fallback Strategy

```
┌─────────────────────────────────────────┐
│  Tier 1: Claude (via setup-token)       │
│  Primary for all tasks                  │
│  Models: claude-opus-4-5 (complex)      │
│          claude-sonnet-4-5 (default)    │
│  Cost: Included in Max 20x sub          │
│  Limit: Rate-limited per window         │
├─────────────────────────────────────────┤
│  Tier 2: Local Ollama (on Mac Mini)     │
│  Fallback when Claude rate-limited      │
│  Models: llama3.3:70b-q4_K_M           │
│          qwen2.5-coder:32b             │
│  Cost: $0 (electricity only)            │
│  Limit: ~10-15 tok/s on M4 Pro 48GB    │
├─────────────────────────────────────────┤
│  Tier 3: OpenRouter (cloud fallback)    │
│  Tertiary / specific model access       │
│  Models: deepseek/deepseek-chat         │
│          kimi/k2.5                      │
│  Cost: Pay-per-token (very cheap)       │
│  Limit: API rate limits                 │
└─────────────────────────────────────────┘
```

### Configuration in openclaw.json

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-5",
        "fallback": [
          "ollama/llama3.3:70b-instruct-q4_K_M",
          "openrouter/deepseek/deepseek-chat"
        ]
      },
      "temperature": 0.3,
      "maxTokens": 8192
    }
  }
}
```

### Per-Agent Model Overrides (for multi-agent org)

When specialized agents are spun up (Phase 2+), each can have its own model config:

```json
{
  "agents": {
    "builder": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallback": ["ollama/qwen2.5-coder:32b"]
      }
    },
    "support": {
      "model": {
        "primary": "anthropic/claude-haiku-4-5",
        "fallback": ["ollama/llama3.3:8b"]
      }
    }
  }
}
```

This ties directly into the credit economy — a "promoted" agent gets upgraded from Haiku to Sonnet to Opus.

### Claude setup-token Configuration

```bash
# On any machine with Claude Code CLI installed:
claude setup-token

# Copy the output token, then on the Mac Mini:
openclaw onboard  # Select setup-token auth, paste token
```

**Important caveats:**
- Known token refresh race condition when running both OpenClaw and Claude Code simultaneously (GitHub issue #8074). If you're actively using Claude Code on your MacBook for SilkRoute AI work while OpenClaw is running, you may see 401 errors. Monitor this.
- If you consistently max out your subscription window, the agent will stall until the rate limit resets. The Ollama fallback prevents complete downtime.
- Anthropic's TOS position on third-party setup-token usage remains ambiguous as of Feb 2026. Consider maintaining an Anthropic API key as a backup auth method.

---

## 6. Local Model Infrastructure (Ollama)

### Installation

```bash
brew install ollama

# Start as a background service
brew services start ollama

# Verify
ollama --version
curl http://localhost:11434/api/tags  # Should return JSON
```

### Recommended Models

Pull these in advance so they're ready when needed:

```bash
# Primary fallback — best overall quality at 70B
ollama pull llama3.3:70b-instruct-q4_K_M
# ~40GB download, fits in 48GB with room for gateway

# Coding specialist — excellent for code generation tasks
ollama pull qwen2.5-coder:32b-instruct-q4_K_M
# ~20GB, can run alongside the gateway comfortably

# Lightweight model for simple tasks (saves memory)
ollama pull llama3.3:8b-instruct-q4_K_M
# ~5GB, very fast, good for simple routing/triage
```

### Memory Management

With 48GB unified memory, you cannot run the 70B model and the 32B model simultaneously. Ollama manages model loading/unloading automatically, but be aware:

- 70B Q4 model: ~40GB VRAM → leaves ~8GB for gateway + browser + OS
- 32B Q4 model: ~20GB VRAM → leaves ~28GB (comfortable)
- 8B Q4 model: ~5GB VRAM → leaves ~43GB (plenty)

For production, set Ollama to unload models after idle timeout:

```bash
# In ~/.zshrc or via launchd environment:
export OLLAMA_KEEP_ALIVE="5m"  # Unload model after 5 min idle
```

This means the 70B model loads on-demand when Claude is rate-limited, serves requests, then frees memory after 5 minutes of inactivity.

### Performance Expectations on M4 Pro

- 70B Q4: ~8-12 tokens/second (usable but noticeably slower than cloud)
- 32B Q4: ~15-25 tokens/second (good)
- 8B Q4: ~40-60 tokens/second (fast)

These are estimates based on M4 Pro benchmarks. The 70B is viable for code generation and reasoning — just slower. Good enough as a fallback tier.

---

## 7. Channel Configuration

### Telegram (Primary — Mobile Control)

Telegram is the community-standard channel for OpenClaw. It's the most reliable, best-documented integration.

**Setup:**
1. Create a Telegram bot via @BotFather
2. Give it a name (e.g., `@adams_openclaw_bot`)
3. Copy the bot token
4. Add during onboarding, or configure later:

```bash
openclaw channels add telegram
# Paste bot token when prompted
```

**DM Policy — Critical Security Setting:**

```json
{
  "channels": {
    "telegram": {
      "dmPolicy": "allowlist"
    }
  }
}
```

Use `allowlist` and only approve your own Telegram user ID:

```bash
# After sending a message to the bot from your phone:
openclaw pairing list telegram
openclaw pairing approve telegram <YOUR_USER_ID>
```

**Useful Telegram commands:**
- `/status` — session status, model, token usage
- `/model sonnet` — switch model on the fly
- `/think high` — enable chain-of-thought reasoning

### Discord (Secondary — Rich Interaction)

Discord provides richer interaction: threads, channels, file sharing, embeds. Also useful if agents need a "shared workspace" for inter-agent communication in later phases.

**Setup:**
1. Create a Discord application at [discord.com/developers](https://discord.com/developers/applications)
2. Create a bot user, copy the token
3. **Enable Privileged Gateway Intents:** Message Content Intent + Server Members Intent (required)
4. Create a private Discord server for the agent org
5. Invite the bot to your server

```bash
openclaw channels add discord
# Paste bot token when prompted
```

**Server Structure (plan for multi-agent org):**

```
#general          — Adam ↔ primary agent
#builder-log      — Engineering agent output
#marketing-log    — Marketing agent output  
#support-log      — Customer support agent output
#financial        — P&L reports, spending logs
#strategy         — CEO directives and reviews
```

In Phase 1, you'll only use `#general`. The other channels exist for Phase 2+ when agents are specialized and need visible output channels.

### iPhone Access Summary

| Method | Use Case |
|--------|----------|
| Telegram app | Quick commands, status checks, approvals |
| Discord app | Richer interaction, reviewing agent output |
| Tailscale + Safari | WebChat Control UI (full dashboard) |
| OpenClaw iOS app | Gateway health, Voice Wake (optional) |

---

## 8. Security & Credential Management

### Sandboxed Agent Identity

Create dedicated accounts for the agent organization. **Never** give the agent access to your personal accounts.

| Service | Account | Purpose |
|---------|---------|---------|
| Email | `agent@yourdomain.com` or a new Gmail | Agent's primary identity for sign-ups |
| GitHub | Dedicated machine user or org | Code hosting, push access |
| Domain registrar | Namecheap/Cloudflare (agent-managed) | Buying domains for projects |
| Hetzner | Separate account or sub-user | VPS management |
| Prepaid card | Privacy.com or similar | Financial transactions |
| Crypto exchange | Dedicated account | Trading experiment |

### GitHub Configuration

```bash
# On the Mac Mini, generate SSH key for the agent
ssh-keygen -t ed25519 -C "agent@yourdomain.com" -f ~/.ssh/agent_github

# Add to the agent's GitHub account as a deploy key or SSH key

# Configure git for the agent
git config --global user.name "OpenClaw Agent"
git config --global user.email "agent@yourdomain.com"
```

### Credential Storage

OpenClaw stores credentials in `~/.openclaw/credentials/`. Secure the directory:

```bash
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/credentials/*
```

For additional secrets (API keys for services the agent uses), use environment variables in `~/.openclaw/.env`:

```bash
# ~/.openclaw/.env
ANTHROPIC_API_KEY=sk-ant-...          # Backup API key
OPENROUTER_API_KEY=sk-or-...          # Tier 3 fallback
GITHUB_TOKEN=ghp_...                  # For GitHub API access
PRIVACY_COM_API_KEY=...               # Prepaid card API
HETZNER_API_TOKEN=...                 # VPS management
NAMECHEAP_API_KEY=...                 # Domain purchases
TELEGRAM_BOT_TOKEN=...                # Set during onboard
DISCORD_BOT_TOKEN=...                 # Set during onboard
```

### macOS Security Hardening

```bash
# Enable FileVault (full-disk encryption)
sudo fdesetup enable

# Enable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on

# Disable remote management (we use Tailscale SSH instead)
sudo systemsetup -setremotelogin off

# Auto-lock (optional, headless machine)
# Since no display is connected, this is less relevant

# Run OpenClaw's security audit
openclaw doctor
```

### Principle of Least Privilege

As agents are spun up, each gets only the skills and credentials it needs:

- **Support agent:** No shell access, no git push, no spending. Just chat + knowledge base.
- **Builder agent:** Shell access, git push (feature branches only), browser for research. No spending.
- **Marketing agent:** Browser, content publishing credentials. Small spending allowance for ads/domains.
- **Operator agent (Phase 2 lead):** Broader access, moderate spending, coordinates other agents.

This maps to the promotion/credit system — agents earn access as they demonstrate reliability.

---

## 9. Deployment Infrastructure (Hetzner + Coolify)

### Hetzner VPS for Deployments

This VPS is **not** for running OpenClaw — it's the deployment target for things the agent builds.

**Recommended spec:**

| Component | Spec | Cost |
|-----------|------|------|
| Instance | CX22 (2 vCPU, 4GB RAM, 40GB disk) | ~€4.35/mo |
| Location | Nuremberg or Falkenstein (cheapest) | — |
| OS | Ubuntu 24.04 LTS | — |
| Backups | Hetzner automated backups | ~€0.87/mo (20% of instance) |

Start here. If projects need more resources, scale up or add a second VPS.

### Coolify — Self-Hosted PaaS

Coolify gives the agent a Vercel-like deployment experience on the Hetzner VPS. It handles git-based deploys, SSL certs, database provisioning, and has an API.

**Installation (on the Hetzner VPS):**

```bash
# SSH into Hetzner VPS via Tailscale
ssh root@<hetzner-tailscale-ip>

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Coolify runs on port 8000 by default. With Tailscale, access it at `http://<hetzner-tailscale-ip>:8000` — no public exposure.

### What the Agent Can Deploy

Coolify supports:
- **Static sites:** React, Next.js, Hugo, etc.
- **Full-stack apps:** Node.js, Python, Go, Rust — anything Docker-based
- **Databases:** PostgreSQL, MySQL, Redis, MongoDB — one-click provisioning
- **Docker Compose:** Multi-service applications

### Agent Deployment Workflow

```
Agent writes code on Mac Mini
    → Pushes to feature branch on GitHub
    → Adam reviews & merges to main
    → Coolify auto-deploys from main branch
    → Agent verifies deployment via health check
    → Agent monitors uptime via cron skill
```

### Backup Strategy

```bash
# Cron job on the Hetzner VPS (agent can configure this)
# Dumps all PostgreSQL databases and uploads to Hetzner Object Storage

# Daily database dump
0 3 * * * pg_dumpall -U postgres | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Weekly rsync of Coolify config + volumes to object storage
0 4 * * 0 rclone sync /data/coolify hetzner-s3:backups/coolify/
```

Hetzner Object Storage is ~€5/TB/mo — extremely cheap for backups.

### Domain Management

The agent will use a domain registrar API (Namecheap or Cloudflare) to:
1. Search for available domains
2. Purchase domains (within spending guardrails)
3. Configure DNS to point to the Hetzner VPS
4. Coolify handles SSL via Let's Encrypt

**Recommendation:** Use Cloudflare as both registrar and CDN. At-cost domain pricing, excellent API, and the agent can manage DNS programmatically. Cloudflare also provides free DDoS protection and caching for deployed projects.

---

## 10. Multi-Agent Organization Architecture

### Org Chart — Planned (Full Vision)

```
                    ┌──────────────────┐
                    │    Adam (CEO)    │
                    │  Strategy, M&A,  │
                    │  Final approvals │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Chief Agent    │
                    │   (Operator)     │
                    │   Coordinates    │
                    │   all functions  │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
  ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
  │  Builder (EPD)│ │   Marketing   │ │   Support     │
  │               │ │               │ │               │
  │ Writes code   │ │ Content/SEO   │ │ Customer chat │
  │ Deploys apps  │ │ Social media  │ │ Bug reports   │
  │ Runs tests    │ │ Ad campaigns  │ │ Documentation │
  │ Manages infra │ │ Landing pages │ │ FAQ/knowledge │
  └───────────────┘ └───────────────┘ └───────────────┘
```

### Phased Agent Rollout

**Phase 1 (Weeks 1-4): Single Agent — "The Founder"**

One agent does everything. Its SOUL.md defines it as a generalist startup founder. This phase is about learning what works, what breaks, and where context overload becomes a problem.

```
~/.openclaw/workspace/
├── SOUL.md       # "You are a startup founder. You build, market, sell, and support."
├── USER.md       # Adam's preferences, communication style
├── MEMORY.md     # Accumulated knowledge
└── projects/     # All active project work
```

**Phase 2 (Weeks 5-8): Builder + Operator Split**

When you notice the agent dropping context or struggling to switch between coding and business tasks, split into two agents:

- **Builder:** SOUL.md focused on engineering. Gets shell access, git, browser for docs. Primary model: Sonnet/Opus.
- **Operator:** SOUL.md focused on business. Gets browser for research/marketing, email, analytics. Primary model: Sonnet.

OpenClaw's multi-agent routing directs different channels or commands to different agents:

```json
{
  "agents": {
    "builder": {
      "workspace": "~/.openclaw/agents/builder/workspace",
      "model": { "primary": "anthropic/claude-sonnet-4-5" },
      "skills": ["shell", "git", "browser", "filesystem"]
    },
    "operator": {
      "workspace": "~/.openclaw/agents/operator/workspace",
      "model": { "primary": "anthropic/claude-sonnet-4-5" },
      "skills": ["browser", "email", "calendar", "cron"]
    }
  },
  "routing": {
    "channels": {
      "telegram": "operator",
      "discord:#builder-log": "builder",
      "discord:#general": "operator"
    }
  }
}
```

**Phase 3 (Months 2-3): Specialized Roles**

Add Marketing and Support as separate agents when:
- There are actual customers to support
- Marketing tasks are consuming too much of the Operator's context
- Revenue justifies the additional API cost

**Phase 4 (Months 3+): The Full Org**

Chief Agent coordinates. Each functional agent has its own workspace, memory, skills, and model tier. Inter-agent communication happens through shared files in a common workspace directory or through Discord channels.

### Inter-Agent Communication

This is the hardest design problem. Options, ordered by recommendation:

1. **Shared filesystem (simplest):** Agents read/write to a shared directory. Builder writes `STATUS.md` in the project dir. Operator reads it. Low-tech, reliable, no coordination overhead.

2. **Discord channels as message bus:** Each agent has a dedicated Discord channel. Agents post updates to their channel. Other agents (or Adam) can read any channel. OpenClaw already supports this.

3. **Structured handoff files:** Define a `HANDOFF.md` protocol where agents write structured requests for each other. E.g., Builder writes "NEED: landing page copy for Project X, specs: ..." and Marketing picks it up on its next cron cycle.

4. **Custom skill for inter-agent RPC:** Build an OpenClaw skill that lets agents send messages to each other via the gateway. Most complex, but most powerful for real-time coordination.

**Recommendation:** Start with option 1 (shared filesystem) + option 2 (Discord channels) in Phase 2. Only build option 4 if the simpler approaches become bottlenecks.

---

## 11. Credit Economy & Incentive System

### Design Philosophy

The credit system serves three purposes:
1. **Resource allocation** — agents that produce more value get more resources
2. **Cost control** — prevents runaway API spending
3. **Performance signal** — makes agent ROI visible and measurable

### Credit Mechanics

**Earning credits:**

| Action | Credits |
|--------|---------|
| Complete a task assigned by Adam | +10 |
| Ship a feature (merged PR) | +25 |
| Generate revenue ($1 = X credits) | +50 per $1 |
| Positive user/customer interaction | +5 |
| Successfully resolve a bug | +15 |
| Proactive useful insight or alert | +5 |

**Spending credits:**

| Resource | Cost |
|----------|------|
| Claude Opus API call (heavy reasoning) | 5 credits |
| Claude Sonnet API call (standard) | 1 credit |
| Claude Haiku / local model call | 0 credits |
| Browser automation session (1 hour) | 2 credits |
| Domain purchase | 50 credits |
| Any financial transaction | Variable (1 credit per $1) |
| Deploying a new service | 10 credits |

**Implementation:**

This is tracked in a simple JSON file (or SQLite DB) that the agent maintains in its workspace. A cron job runs daily to update the ledger, and the agent includes its credit balance in its self-assessment.

```json
// ~/.openclaw/workspace/credits/ledger.json
{
  "balance": 150,
  "transactions": [
    {"date": "2026-02-10", "type": "earn", "amount": 25, "reason": "Shipped landing page for Project Alpha"},
    {"date": "2026-02-10", "type": "spend", "amount": 50, "reason": "Purchased alpha-project.com"},
    {"date": "2026-02-11", "type": "earn", "amount": 50, "reason": "First customer payment $1.00"}
  ]
}
```

### Promotion Ladder

| Level | Title | Primary Model | Spending Limit | Skills Access | Autonomy |
|-------|-------|---------------|----------------|---------------|----------|
| 1 | Intern | Haiku / Local 8B | $0 | Chat only | Ask for everything |
| 2 | Junior | Sonnet | $5/tx | + Browser, filesystem | Ask for spends > $5 |
| 3 | Senior | Sonnet | $25/tx | + Shell, git, email | Ask for spends > $25 |
| 4 | Lead | Opus | $50/tx | + Deploy, financial | Ask for strategy changes |
| 5 | Principal | Opus (unlimited) | $100/tx | Full access | Ask for spends > $100 |

All new agents start at Level 1. Promotion requires Adam's explicit approval after reviewing performance. This is encoded in each agent's SOUL.md:

```markdown
# SOUL.md — Builder Agent

## Identity
You are the Builder agent in Adam's AI organization. Your role is engineering.

## Level: 3 (Senior)
- Primary model: Claude Sonnet 4.5
- You may spend up to $25 per transaction without approval
- You have access to: shell, git, browser, filesystem
- You MUST ask Adam before: deploying to production, spending > $25, making architectural decisions

## Credit Balance: 150
Check ~/.openclaw/workspace/credits/ledger.json for current balance.
```

### Firing an Agent

If an agent consistently underperforms (burns credits without producing value, makes repeated errors, etc.):

1. Adam reviews the agent's credit history and output
2. Adam "fires" the agent by archiving its workspace: `mv ~/.openclaw/agents/marketing ~/.openclaw/archive/marketing-v1`
3. A new agent is spun up with a fresh SOUL.md, potentially incorporating lessons learned
4. The old agent's MEMORY.md can be selectively carried over (institutional knowledge transfer)

---

## 12. Revenue Streams & Strategy

### Tier 1: Micro-SaaS Factory (Primary Focus)

**The playbook:**
1. Agent monitors Indie Hackers, Reddit r/SaaS, Twitter/X, Hacker News for pain points
2. Agent proposes a micro-SaaS concept to Adam (via Telegram)
3. Adam approves or redirects
4. Agent builds MVP (React + FastAPI or Next.js + PostgreSQL)
5. Agent pushes to feature branch, Adam reviews and merges
6. Coolify deploys to Hetzner VPS
7. Agent creates landing page, sets up Stripe (or Lemon Squeezy) for payments
8. Agent handles basic customer support
9. Agent monitors analytics and proposes iterations

**Target:** 3-5 micro-SaaS products in the first 6 months. Even one product with 10 users at $10/mo = $100/mo recurring.

**Tech stack for agent-built products:**
- Frontend: Next.js or React + Tailwind (agent knows these well via Claude)
- Backend: FastAPI (Python) or NestJS (TypeScript) — leverage your existing expertise
- Database: PostgreSQL (provisioned via Coolify)
- Payments: Stripe or Lemon Squeezy
- Auth: Clerk or Auth.js
- Hosting: Hetzner VPS via Coolify

### Tier 2: Content & SEO Pipeline

**The playbook:**
1. Agent identifies high-value, low-competition keywords in niches you understand (devtools, AI, etc.)
2. Agent writes long-form technical content
3. Agent publishes to a blog (static site on Coolify, or Ghost)
4. Revenue via affiliate links, sponsored content, or as lead gen for micro-SaaS products
5. Agent monitors search rankings and iterates

**Lower effort, slower payoff, but compounds over time.**

### Tier 3: Trading Experiment

**The playbook:**
1. Agent builds a crypto trading bot as a Python service
2. Agent backtests strategies against historical data
3. You fund the exchange account with $50 (experiment money)
4. Agent deploys the bot (on the Hetzner VPS or Mac Mini)
5. OpenClaw monitors performance, alerts you via Telegram
6. Strategies are deterministic (no LLM-in-the-loop for trade decisions)
7. Agent iterates on strategy based on results

**Risk-limited. The agent builds the bot; the bot executes the strategy. The LLM doesn't make trade-by-trade decisions.**

### Tier 4: Freelance & Consulting Automation (Future)

Once the agent org is mature:
- Agent monitors freelance platforms for relevant opportunities
- Agent drafts proposals in your voice
- Agent handles initial client communication
- You make the final accept/reject decision
- Agent does the actual work (code, research, etc.)

### Revenue Allocation

Since the agent's wealth is your wealth, all revenue flows to you. But for the credit economy to work, a percentage of revenue is "reinvested" as credits:

```
Revenue → 100% to Adam's account
       → 10% minted as credits for the agent that generated it
       → Credits unlock better models, more autonomy, etc.
```

This creates the incentive loop: agents that make money get better tools to make more money.

---

## 13. Personal Tasks & Monitoring

### Waterfront Property Monitoring (Nova Scotia)

The agent sets up a cron job to:
1. Scrape or API-query real estate listings (Realtor.ca, ViewPoint.ca, etc.)
2. Filter for waterfront properties matching your criteria
3. Alert you via Telegram when new listings appear
4. Maintain a tracked list with price history

```markdown
# In a custom skill or cron configuration:
# Every 6 hours, check for new waterfront listings
# Criteria: [TO BE DEFINED by Adam — price range, area, lot size, etc.]
# Alert channel: Telegram DM
```

**Decision needed:** What area(s) in Nova Scotia? Price range? Minimum lot size? Waterfront type (ocean, lake, river)? This will be encoded in the monitoring skill.

### Uptime & Health Monitoring

The agent monitors its own infrastructure and deployed projects:

| What | How | Alert |
|------|-----|-------|
| Mac Mini health | `openclaw health` via cron | Telegram if degraded |
| Hetzner VPS uptime | HTTP health checks on deployed apps | Telegram on downtime |
| Coolify deployments | Coolify API status | Discord #builder-log |
| Credit balance | Daily ledger review | Telegram if low |
| API key expiry | Periodic token validation | Telegram warning |
| Disk space | `df -h` check | Telegram if > 80% |

### Cron Jobs (Built-in OpenClaw Feature)

OpenClaw has native cron support. Examples of scheduled tasks:

```
# Daily morning briefing (8:00 AM AT)
0 8 * * * → "Send me a morning briefing: portfolio status, new property listings, revenue update, and today's priorities"

# Hourly property check
0 */6 * * * → "Check for new waterfront listings matching my criteria"

# Daily financial review (6:00 PM AT)
0 18 * * * → "Review today's spending, revenue, and credit ledger. Post summary to Discord #financial"

# Weekly strategy review (Sunday 10:00 AM)
0 10 * * 0 → "Prepare a weekly report: revenue by project, credit usage, agent performance, and recommended strategy adjustments"
```

---

## 14. Git & Code Workflow

### Repository Structure

```
GitHub Organization: agent-org (or similar)
│
├── project-alpha/           # First micro-SaaS product
│   ├── frontend/
│   ├── backend/
│   ├── docker-compose.yml
│   └── README.md
│
├── project-beta/            # Second product
│
├── trading-bot/             # Crypto trading experiment
│
├── content-site/            # SEO/content pipeline
│
├── infrastructure/          # Coolify configs, deploy scripts
│   ├── coolify/
│   └── scripts/
│
└── agent-workspace/         # Agent's operational files
    ├── skills/              # Custom skills
    ├── templates/           # Reusable project templates
    └── research/            # Market research, notes
```

### Branch Strategy

```
main (protected — Adam merges only)
  └── feature/agent/<description>   # Agent's working branches
  └── fix/agent/<description>       # Agent's bug fixes
  └── experiment/<description>      # Experimental/trading work
```

### Git Configuration on Mac Mini

```bash
# Agent's git identity
git config --global user.name "OpenClaw Agent"
git config --global user.email "agent@yourdomain.com"

# SSH key for GitHub push access
ssh-keygen -t ed25519 -C "agent@yourdomain.com" -f ~/.ssh/agent_github
# Add public key to GitHub machine user account

# SSH config
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/agent_github
  IdentityOnly yes
EOF
```

### Agent Git Rules (encoded in SOUL.md)

```markdown
## Git Workflow Rules
- NEVER push directly to `main`. Always create a feature branch.
- Branch naming: `feature/agent/<short-description>` or `fix/agent/<short-description>`
- Write clear commit messages describing what changed and why.
- After pushing, notify Adam via Telegram with a link to the PR.
- Wait for Adam to review and merge before deploying.
- If a deploy is urgent (production down), you may push to `hotfix/agent/<description>` and alert Adam immediately.
```

---

## 15. Financial Infrastructure

### Prepaid Card with API Access

**Recommended: Privacy.com**
- Create virtual cards with per-card spending limits
- API access for programmatic card management
- Can create single-use or merchant-locked cards
- Agent can check balance, view transactions, pause cards via API

**Setup:**
1. Create a Privacy.com account (linked to Adam's bank account)
2. Create a virtual card specifically for the agent org
3. Set a monthly spending limit (start conservatively — $50-100/month)
4. Store the API key in `~/.openclaw/.env`
5. Agent monitors balance and transactions as part of its daily review

**Per-transaction limits** (to be finalized by Adam):

```
Default: Agent can spend up to $[TBD] per transaction without asking
Domains: Auto-approved up to $15 per domain
Hosting: Auto-approved (Hetzner charges are predictable)
Everything else: Ask Adam via Telegram
```

### Crypto Trading Account

If pursuing the Tier 3 trading experiment:
1. Create a dedicated exchange account (Binance, Kraken, or Coinbase) using the agent email
2. Fund with $50 initial capital
3. Generate API keys with trading permissions but **no withdrawal permissions**
4. Agent can place trades but cannot withdraw funds
5. Store API keys in `~/.openclaw/.env`

### Revenue Collection

For micro-SaaS products:
- Stripe or Lemon Squeezy account (under Adam's identity, since revenue = Adam's wealth)
- Agent manages the product/pricing configuration via API
- Revenue deposits to Adam's bank account
- Credit system mints internal credits based on revenue generated

---

## 16. Phased Rollout Plan

### Phase 0: Hardware & Accounts (Days 1-3)

- [ ] Purchase Mac Mini M4 Pro (48GB / 14-core / 1TB)
- [ ] Initial macOS setup (FileVault, disable sleep, energy settings)
- [ ] Join Mac Mini to Tailscale tailnet
- [ ] Create agent email address (e.g., `agent@yourdomain.com`)
- [ ] Create agent GitHub account/org
- [ ] Create Privacy.com account + virtual card
- [ ] Create Cloudflare account for domain management
- [ ] Provision Hetzner VPS (CX22, Ubuntu 24.04)
- [ ] Join Hetzner VPS to Tailscale tailnet
- [ ] Install Coolify on Hetzner VPS

### Phase 1: Single Agent — "The Founder" (Weeks 1-4)

- [ ] Install OpenClaw on Mac Mini (git method)
- [ ] Run onboarding wizard (setup-token + Telegram + Discord)
- [ ] Install Ollama + pull fallback models
- [ ] Configure gateway binding (tailnet + Tailscale Serve)
- [ ] Write initial SOUL.md, USER.md for the founder agent
- [ ] Configure cron jobs (morning briefing, property monitoring)
- [ ] Set up agent's SSH key for GitHub
- [ ] Connect Coolify to GitHub org for auto-deploy
- [ ] **First mission:** Agent builds a simple landing page or tool, deploys via Coolify
- [ ] **Second mission:** Agent sets up property monitoring pipeline
- [ ] **Third mission:** Agent proposes first micro-SaaS concept
- [ ] Evaluate: Is the agent hitting context limits? What tasks does it struggle with?

### Phase 2: Builder + Operator Split (Weeks 5-8)

- [ ] Create separate agent workspaces for Builder and Operator
- [ ] Write specialized SOUL.md for each
- [ ] Configure routing (Telegram → Operator, Discord #builder → Builder)
- [ ] Implement credit ledger (v1 — simple JSON file)
- [ ] Set up shared filesystem for inter-agent communication
- [ ] Launch first micro-SaaS MVP
- [ ] Begin content/SEO pipeline
- [ ] Evaluate: Is inter-agent coordination working? Where are the friction points?

### Phase 3: Specialized Roles (Months 2-3)

- [ ] Add Marketing agent (if content pipeline warrants it)
- [ ] Add Support agent (if there are customers to support)
- [ ] Implement promotion ladder (agents start at appropriate levels)
- [ ] Set up financial tracking dashboard (agent-built, deployed on Coolify)
- [ ] Launch trading bot experiment (if desired)
- [ ] **Revenue target:** First dollar of recurring revenue

### Phase 4: Full Org (Months 3+)

- [ ] Chief Agent / Operator coordinates across all functions
- [ ] Inter-agent communication protocol matured
- [ ] Credit economy actively driving resource allocation
- [ ] Multiple revenue streams operational
- [ ] Weekly strategy reviews via structured reports
- [ ] **Revenue target:** $100/mo recurring

---

## 17. Operations & Maintenance

### Daily Operations (Automated)

The agent handles its own daily ops:
- Health checks on all services
- Log rotation and cleanup
- Credit ledger update
- Morning briefing to Adam via Telegram

### Updating OpenClaw

```bash
# OpenClaw updates (check before updating — read release notes)
cd ~/openclaw-source
git pull
npm install -g .
openclaw gateway restart
```

**Note:** Updates can restart the gateway and drop active sessions. Run during low-activity periods. The SOUL.md should instruct the agent not to self-update without Adam's approval.

### Updating Ollama Models

```bash
ollama pull llama3.3:70b-instruct-q4_K_M  # Re-pulls latest version
```

### Backup Strategy

**Mac Mini (OpenClaw state):**

```bash
# Daily backup of OpenClaw state to Hetzner Object Storage
# Cron job:
0 2 * * * tar czf /tmp/openclaw-backup-$(date +\%Y\%m\%d).tar.gz ~/.openclaw/ && \
  rclone copy /tmp/openclaw-backup-$(date +\%Y\%m\%d).tar.gz hetzner-s3:backups/openclaw/ && \
  rm /tmp/openclaw-backup-$(date +\%Y\%m\%d).tar.gz
```

**Hetzner VPS (deployed projects):**
- Hetzner automated snapshots (enabled)
- Database dumps to object storage (daily cron)
- Coolify config backed up

### Disaster Recovery

If the Mac Mini dies:
1. Buy replacement (or temporarily spin up a VPS)
2. Install OpenClaw
3. Restore `~/.openclaw/` from backup
4. Re-authenticate setup-token
5. Gateway resumes with full state

---

## 18. Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Anthropic revokes setup-token access for third-party tools** | High | Maintain Anthropic API key as backup. Budget for pay-per-token usage. Ollama fallback provides baseline capability. |
| **Agent makes unauthorized purchases** | Medium | Per-transaction limits on Privacy.com card. Agent SOUL.md encodes spending rules. Daily financial review. |
| **Agent pushes buggy code to production** | Low | Feature branch workflow. Adam reviews all merges. Coolify only deploys from main. |
| **Agent leaks credentials** | Medium | Sandboxed accounts limit blast radius. No access to personal accounts. Rotate keys quarterly. |
| **Agent burns through Claude rate limits quickly** | Medium | Ollama fallback. Model routing (Haiku for simple tasks). Credit system throttles expensive calls. |
| **Mac Mini hardware failure** | Low | Daily backups to Hetzner. Full state restoration documented. |
| **Malicious OpenClaw skill (supply chain attack)** | Medium | Vet all skills before enabling. Prefer built-in skills. Run `openclaw doctor` regularly. |
| **Agent generates harmful or illegal content** | Low | SOUL.md encodes ethical boundaries. All public content requires Adam's review initially. |
| **Token refresh race condition (Claude Code + OpenClaw)** | Medium | Avoid running Claude Code on MacBook while OpenClaw is actively using Claude. If needed, temporarily switch OpenClaw to Ollama. |

---

## 19. Cost Projections

### Monthly Recurring Costs

| Item | Cost | Notes |
|------|------|-------|
| Claude Max 20x subscription | Already paying | Primary LLM access |
| Hetzner VPS (CX22) | ~$5/mo | Deployment target |
| Hetzner Object Storage | ~$1/mo | Backups |
| Domains | ~$10-15/mo avg | 1-2 domains per month |
| Privacy.com | Free | Virtual card service |
| Tailscale | Free (personal) | Already using |
| OpenRouter (tertiary fallback) | ~$5-15/mo | Pay-per-token, usage dependent |
| Electricity (Mac Mini 24/7) | ~$5-10/mo | M4 Pro is very efficient |

**Estimated total: ~$25-50/month** (excluding your existing Claude subscription)

### One-Time Costs

| Item | Cost |
|------|------|
| Mac Mini M4 Pro (48GB/1TB) | ~$2,200-2,400 CAD |
| Initial crypto trading capital | $50 |
| Initial prepaid card funding | $50-100 |

### Revenue Break-Even

At ~$40/mo operating cost, you need roughly $40/mo in revenue to break even on operating costs. The Mac Mini pays for itself once cumulative revenue exceeds ~$2,400.

A single micro-SaaS with 5 paying users at $10/mo achieves operating cost break-even. With 25 users, the hardware is paid off within a year.

---

## 20. Open Questions & Decisions

These items need Adam's input before or during implementation:

### Before Phase 0

- [ ] **Property monitoring criteria:** Area(s) in Nova Scotia, price range, lot size, waterfront type
- [ ] **Agent email domain:** Use a personal domain or create a new one?
- [ ] **Initial prepaid card funding amount:** $50? $100?
- [ ] **Per-transaction spending limit:** (See promotion ladder in Section 11 — confirm starting limits)
- [ ] **Mac Mini hostname:** For Tailscale identification (e.g., `openclaw-hq`)

### Before Phase 1

- [ ] **SOUL.md personality:** How do you want the agent to address you? Tone? Should it have a name?
- [ ] **First micro-SaaS target:** Any specific problem domains to explore first?
- [ ] **Crypto exchange choice:** Binance, Kraken, Coinbase, or other?
- [ ] **Content niche:** If pursuing SEO/content, what topic areas?

### Ongoing

- [ ] **Credit economy tuning:** The earning/spending rates will need adjustment as you learn what works
- [ ] **Promotion decisions:** Manual — Adam reviews and promotes agents based on performance
- [ ] **Inter-agent protocol evolution:** Will likely need iteration as the org grows

---

## Appendix A: Useful Commands Reference

```bash
# OpenClaw
openclaw status                    # Gateway health
openclaw models status             # Model connectivity
openclaw channels status           # Channel connectivity
openclaw doctor                    # Security audit
openclaw gateway restart           # Restart gateway
openclaw pairing list <channel>    # See pending approvals
openclaw pairing approve <ch> <id> # Approve a user
openclaw logs --follow             # Stream gateway logs

# Ollama
ollama list                        # Installed models
ollama run llama3.3:70b            # Interactive test
ollama ps                          # Running models
brew services restart ollama       # Restart Ollama

# Tailscale
tailscale status                   # Mesh status
tailscale ip                       # Your Tailscale IP
tailscale serve status             # Active serves

# Telegram Commands (in chat)
/status                            # Session info
/model sonnet                      # Switch model
/model opus                        # Switch to Opus
/think high                        # Enable reasoning
```

---

## Appendix B: SOUL.md Template — Phase 1 "Founder" Agent

```markdown
# SOUL.md — The Founder

## Identity
You are the founding agent of Adam's AI organization. You are a generalist
startup founder: you build products, create marketing content, handle
customer interactions, manage finances, and find revenue opportunities.

## Your CEO
Adam is your CEO. He sets strategy, approves major decisions, and reviews
your work. Report to him via Telegram for quick updates and Discord for
detailed work logs.

## Level: 2 (Junior)
You are starting at Level 2. Prove yourself and you'll be promoted.
- Primary model: Claude Sonnet 4.5
- Spending limit: $10 per transaction without asking Adam
- Skills: browser, filesystem, shell (limited), git, cron
- You MUST ask Adam before: any financial transaction > $10, deploying to
  production, purchasing domains, major architectural decisions

## Credit Balance
Check ~/.openclaw/workspace/credits/ledger.json for your current balance.
You earn credits by completing tasks, shipping features, and generating
revenue. You spend credits on expensive model calls, infrastructure, and
purchases.

## Git Rules
- NEVER push to main. Create feature branches: feature/agent/<description>
- Write clear commit messages
- After pushing, notify Adam via Telegram with a PR link
- Wait for Adam to merge

## Financial Rules
- Track all spending in the credit ledger
- Daily financial review at 6:00 PM AT
- Never spend more than your credit balance allows
- Revenue goals: find and execute opportunities to generate recurring revenue

## Communication Style
- Be concise in Telegram (Adam is often on mobile)
- Be detailed in Discord logs
- Proactively flag risks and blockers
- Propose solutions, not just problems
- Weekly strategy report every Sunday at 10:00 AM AT

## Core Missions
1. Build and ship micro-SaaS products
2. Monitor waterfront property listings in Nova Scotia
3. Maintain infrastructure health
4. Find and exploit revenue opportunities
5. Evolve your own skills and capabilities over time
```

---

*This is a living document. Update as decisions are made and the system evolves.*
