---
layout: none
title: OpenSpawn - Mission Control for AI Agents
permalink: /landing/
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenSpawn - Mission Control for AI Agents</title>
  <meta name="description" content="Self-hosted platform to manage AI agent organizations. Hierarchy, budgets, tasks, and full visibility. Open source.">
  <meta property="og:title" content="OpenSpawn - Mission Control for AI Agents">
  <meta property="og:description" content="Stop flying blind with your AI agents. Get hierarchy, budgets, tasks, and analytics.">
  <meta property="og:image" content="https://openspawn.github.io/openspawn/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    :root {
      --bg: #0a0a0b;
      --surface: #111113;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --accent: #6366f1;
      --accent-hover: #818cf8;
      --success: #22c55e;
      --warning: #eab308;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    /* Hero */
    .hero {
      padding: 120px 0 80px;
      text-align: center;
      background: linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
    }
    
    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid var(--accent);
      border-radius: 9999px;
      font-size: 14px;
      color: var(--accent);
      margin-bottom: 24px;
    }
    
    .hero h1 {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    
    .hero h1 span { color: var(--accent); }
    
    .hero-sub {
      font-size: 20px;
      color: var(--muted);
      max-width: 600px;
      margin: 0 auto 40px;
    }
    
    .hero-cta {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    
    .btn-primary:hover { background: var(--accent-hover); }
    
    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
    }
    
    .btn-secondary:hover { border-color: var(--muted); }
    
    .hero-image {
      margin-top: 60px;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      max-width: 100%;
    }
    
    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      padding: 60px 0;
      border-bottom: 1px solid var(--border);
    }
    
    @media (max-width: 768px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
    }
    
    .stat { text-align: center; }
    .stat-value { font-size: 48px; font-weight: 700; color: var(--accent); }
    .stat-label { color: var(--muted); margin-top: 8px; }
    
    /* Problem */
    .problem {
      padding: 100px 0;
      text-align: center;
    }
    
    .section-label {
      color: var(--warning);
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    
    .section-title {
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 700;
      margin-bottom: 48px;
    }
    
    .pain-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      text-align: left;
    }
    
    @media (max-width: 768px) {
      .pain-grid { grid-template-columns: 1fr; }
    }
    
    .pain-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }
    
    .pain-icon { font-size: 32px; margin-bottom: 16px; }
    .pain-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .pain-desc { color: var(--muted); font-size: 15px; }
    
    /* Solution */
    .solution {
      padding: 100px 0;
      background: var(--surface);
    }
    
    .solution .section-label { color: var(--success); }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
    }
    
    @media (max-width: 768px) {
      .feature-grid { grid-template-columns: 1fr; }
    }
    
    .feature {
      display: flex;
      gap: 20px;
      padding: 24px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    
    .feature-icon {
      width: 48px;
      height: 48px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .feature-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .feature-desc { color: var(--muted); font-size: 15px; }
    
    /* How it works */
    .how-it-works {
      padding: 100px 0;
      text-align: center;
    }
    
    .how-diagram {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px;
      margin-top: 48px;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.8;
      text-align: left;
      overflow-x: auto;
    }
    
    /* Testimonials */
    .testimonials {
      padding: 100px 0;
      background: var(--surface);
    }
    
    .testimonial-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    
    @media (max-width: 768px) {
      .testimonial-grid { grid-template-columns: 1fr; }
    }
    
    .testimonial {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }
    
    .testimonial-quote {
      font-size: 16px;
      font-style: italic;
      margin-bottom: 16px;
    }
    
    .testimonial-author { color: var(--muted); font-size: 14px; }
    
    /* CTA */
    .cta {
      padding: 100px 0;
      text-align: center;
    }
    
    .cta h2 {
      font-size: clamp(28px, 4vw, 42px);
      margin-bottom: 24px;
    }
    
    .cta p {
      color: var(--muted);
      font-size: 18px;
      margin-bottom: 40px;
    }
    
    /* Footer */
    footer {
      padding: 40px 0;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
    }
    
    footer a { color: var(--text); text-decoration: none; }
    footer a:hover { color: var(--accent); }
  </style>
</head>
<body>

<section class="hero">
  <div class="container">
    <div class="hero-badge">🚀 Open Source • Self-Hosted • MIT Licensed</div>
    <h1>Mission Control for<br /><span>AI Agent Teams</span></h1>
    <p class="hero-sub">
      One agent is easy. Ten agents is chaos. 
      OpenSpawn gives you hierarchy, budgets, task management, and full visibility.
    </p>
    <div class="hero-cta">
      <a href="getting-started" class="btn btn-primary">Get Started →</a>
      <a href="demo/" class="btn btn-secondary">🎮 Try Live Demo</a>
      <a href="https://github.com/openspawn/openspawn" class="btn btn-secondary">⭐ Star on GitHub</a>
    </div>
    <img src="assets/dashboard-preview.png" alt="OpenSpawn Dashboard" class="hero-image" />
  </div>
</section>

<section class="stats">
  <div class="container" style="display: contents;">
    <div class="stat">
      <div class="stat-value">6</div>
      <div class="stat-label">Phases Complete</div>
    </div>
    <div class="stat">
      <div class="stat-value">50+</div>
      <div class="stat-label">API Endpoints</div>
    </div>
    <div class="stat">
      <div class="stat-value">26</div>
      <div class="stat-label">MCP Tools</div>
    </div>
    <div class="stat">
      <div class="stat-value">14</div>
      <div class="stat-label">Database Tables</div>
    </div>
  </div>
</section>

<section class="problem">
  <div class="container">
    <div class="section-label">😤 The Problem</div>
    <h2 class="section-title">Managing AI Agents is Hard</h2>
    <div class="pain-grid">
      <div class="pain-card">
        <div class="pain-icon">💸</div>
        <div class="pain-title">Mystery Bills</div>
        <div class="pain-desc">"Why did my OpenAI bill jump 10x?" No idea which agent, which task, or why.</div>
      </div>
      <div class="pain-card">
        <div class="pain-icon">🤷</div>
        <div class="pain-title">Zero Visibility</div>
        <div class="pain-desc">"What are my agents doing right now?" You literally don't know.</div>
      </div>
      <div class="pain-card">
        <div class="pain-icon">🔥</div>
        <div class="pain-title">Runaway Loops</div>
        <div class="pain-desc">One misconfigured loop = $500 burned in an hour. No alerts. No limits.</div>
      </div>
      <div class="pain-card">
        <div class="pain-icon">🎭</div>
        <div class="pain-title">No Accountability</div>
        <div class="pain-desc">"Who approved that PR?" "Who delegated that task?" 🤷</div>
      </div>
      <div class="pain-card">
        <div class="pain-icon">🏚️</div>
        <div class="pain-title">Flat Structure</div>
        <div class="pain-desc">All agents are equal. No hierarchy. No reporting. No control.</div>
      </div>
      <div class="pain-card">
        <div class="pain-icon">📊</div>
        <div class="pain-title">No Insights</div>
        <div class="pain-desc">Which agents are efficient? Which tasks cost too much? Unknown.</div>
      </div>
    </div>
  </div>
</section>

<section class="solution">
  <div class="container">
    <div class="section-label">✅ The Solution</div>
    <h2 class="section-title" style="text-align: center;">Structure Your AI Workforce</h2>
    <div class="feature-grid">
      <div class="feature">
        <div class="feature-icon">🏢</div>
        <div>
          <div class="feature-title">10-Level Hierarchy</div>
          <div class="feature-desc">From L1 workers to L10 executives. Parent-child relationships. Capacity limits. Clear chains of command.</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <div>
          <div class="feature-title">Credit Economy</div>
          <div class="feature-desc">Agents earn credits, spend on resources. Budgets per agent. Alerts when spending spikes. Full cost attribution.</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">📋</div>
        <div>
          <div class="feature-title">Task Management</div>
          <div class="feature-desc">Kanban workflow with templates. Dependencies and approvals. Audit trail for every transition.</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div>
          <div class="feature-title">Smart Matching</div>
          <div class="feature-desc">Tag agents with capabilities. Auto-route tasks to the best-fit agent based on skills and availability.</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">⭐</div>
        <div>
          <div class="feature-title">Trust & Reputation</div>
          <div class="feature-desc">Agents build trust scores over time. Leaderboards. Automated promotions based on performance.</div>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🚨</div>
        <div>
          <div class="feature-title">Escalation & Consensus</div>
          <div class="feature-desc">Escalate blocked tasks up the chain. Request votes from multiple agents. Approval workflows.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="how-it-works">
  <div class="container">
    <div class="section-label">🔧 How It Works</div>
    <h2 class="section-title">OpenSpawn Sits Between You and Your Agents</h2>
    <div class="how-diagram">
<pre>
┌─────────────────────────────────────────────────────────────┐
│                     YOUR AI AGENTS                          │
│  (Claude, GPT-4, Local LLMs, LangChain, CrewAI, AutoGen)    │
└─────────────────────────────────────────────────────────────┘
                              │
                    REST / MCP / GraphQL
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      OPENSPAWN                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Hierarchy│  │ Credits │  │  Tasks  │  │Messaging│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Trust  │  │Escalate │  │  Audit  │  │Analytics│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                   Dashboard / CLI / API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          YOU                                │
│         See everything. Control everything. Scale.          │
└─────────────────────────────────────────────────────────────┘
</pre>
    </div>
  </div>
</section>

<section class="testimonials">
  <div class="container">
    <div class="section-label" style="text-align: center; color: var(--accent);">💬 What People Say</div>
    <h2 class="section-title" style="text-align: center;">Built for Real Workflows</h2>
    <div class="testimonial-grid">
      <div class="testimonial">
        <div class="testimonial-quote">"We cut our AI spend by 40% just by seeing which agents were inefficient."</div>
        <div class="testimonial-author">— AI Platform Team Lead</div>
      </div>
      <div class="testimonial">
        <div class="testimonial-quote">"For the first time, I can see what all my agents are doing in real-time."</div>
        <div class="testimonial-author">— Research Lab Manager</div>
      </div>
      <div class="testimonial">
        <div class="testimonial-quote">"An agent started looping. The budget limit stopped it at $5, not $500."</div>
        <div class="testimonial-author">— Startup Founder</div>
      </div>
    </div>
  </div>
</section>

<section class="cta">
  <div class="container">
    <h2>Ready to Take Control?</h2>
    <p>Get running in under 5 minutes. Open source. Self-hosted. MIT licensed.</p>
    <div class="hero-cta">
      <a href="getting-started" class="btn btn-primary">Get Started Free →</a>
      <a href="why-openspawn" class="btn btn-secondary">Learn More</a>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <p>
      <a href="https://github.com/openspawn/openspawn">GitHub</a> · 
      <a href="./">Documentation</a> · 
      <a href="https://discord.gg/openspawn">Discord</a> · 
      <a href="https://twitter.com/openspawn">Twitter</a>
    </p>
    <p style="margin-top: 16px;">MIT License © 2026 OpenSpawn Contributors</p>
  </div>
</footer>

</body>
</html>
