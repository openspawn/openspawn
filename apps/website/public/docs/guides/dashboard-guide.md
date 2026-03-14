---
source: https://openspawn.ai/docs/guides/dashboard-guide
generated: 2026-03-14
---

# Dashboard Guide

## Dashboard Overview

How to use the OpenSpawn dashboard to monitor your org, debug problems, and understand what your agents are doing. Your agent org is running. The dashboard shows you exactly what's happening — in real time. The OpenSpawn dashboard gives you a live window into your multi-agent org: who's working, what they're doing, where work is flowing, and where it's getting stuck. This guide covers every major view and how to use it. When you open the dashboard, you land on the

### Stats Bar

main overview page. This page gives you a high-level pulse on your org at a glance. Four stat cards at the top summarize your org's current state:

### ACP Metrics (Live Orgs)

What it means "Active Agents", "Agents currently in ACTIVE status. +N pending = agents waiting to be activated.", ["Tasks In Progress", "Tasks your agents are actively working on right now."], ["Completed Tasks", "Total tasks that have reached DONE status."], ["Credit Flow", "Net credits earned vs. spent across all agents."], ].map(([stat, meaning]) => ( Each stat card includes a sparkline (mini chart) showing the trend over recent periods — you can see at a glance if things are accelerating, slowing down, or stable. When you're connected to a live sandbox or real org, the dashboard shows a second row of

protocol-level metrics — the health indicators from the Agent Communication Protocol:

Metric

Healthy

Warning

## The Network Graph

### What You're Looking At

What to do ["Ack Latency", " 2s", "Agent may be overwhelmed or API is slow"], "Escalation Rate", "< 10%", "> 30%", "Tasks are poorly routed or agents lack capabilities", ["Avg Delegation Depth", "2-3 levels", "5+ levels", "Org may be over-hierarchical"], ["Completion Rate", "> 90%", "< 70%", "Something is blocking work from finishing"], ].map(([metric, healthy, warning, action]) => ( These four numbers tell you more about org health than any individual agent's status. An escalation rate spike usually means something changed: a new task type arrived that no agent knows how to handle, or a resource (API key, file access) went missing. Navigate to Network in the sidebar. This is the most powerful view in the dashboard. The network graph shows your

```
│
🤖 COO (L10)
/ \\
🤖 Eng Lead 🤖 Marketing Lead
(L7) (L7)
/ \\ \\
🤖 🤖 🤖 🤖 🤖
```

entire org hierarchy as a live, interactive visualization. Each node is an agent; each edge is a reporting relationship. The real graph is interactive — you can pan, zoom, and click any node to open its detail panel. Reading Agent Colors (Heat Map) Agent node color tells you how active each agent currently is:

### Reading Edges

Meaning ["🔴 Red (Hot)", "Very busy — many tasks, high message volume"], ["🟠 Orange (Warm)", "Actively working"], ["🔵 Cyan (Cool)", "Light activity — working but not stressed"], ["⬛ Slate (Idle)", "No active tasks"], ["🔵 Cyan (Human)", "The human principal (always cyan)"], ].map(([color, meaning]) => ( At a glance, you can see if work is spreading across the org (good) or bottlenecked at one node (worth investigating). The lines connecting agents aren't just decorative — they carry information:

Thickness → message volume. Thicker edges mean more ACP messages flowing between those two agents.

Dashed → no recent communication on this relationship.

Animated particles → active task delegation happening right now.

### Clicking an Edge

### Level Badges

Color → matches the activity level of the downstream agent. When you see a very thick edge to one particular worker, that worker may be overloaded. When you see a delegation animation that keeps happening between the same two nodes, that's a high-traffic relationship worth watching. Click any edge to open an edge tooltip showing: This is useful for debugging: "Why are these two agents talking so much?" or "Has this relationship been silent for a long time?" Each agent node shows an L badge (L1–L10) indicating their organizational level:

### Task Count Badge

Role type ["L10", "Pink", "COO / CEO"], ["L9", "Purple", "VP / Director"], ["L7–8", "Green", "Manager / Lead"], ["L5–6", "Cyan", "Senior"], ["L3–4", "Yellow", "Worker / Engineer"], ["L1–2", "Gray", "Junior / Probation"], ].map(([level, color, role]) => ( Higher levels can delegate; lower levels execute. If a task needs to be escalated, it flows upward through these levels. Each agent also shows a purple task badge with the number of tasks currently assigned to it. An agent with a task count of 8+ when others are at 0 is a bottleneck — the org may need another worker in that domain. Compact Mode & Dim Idle Two toggle buttons in the top-left of the network graph help you focus:

▫ Compact — shrinks nodes so you can see larger orgs without scrolling

### Org Chart View

## The Live Feed

### Event Types

◑ Dim Idle — fades out idle agents, focusing attention on active ones Dim Idle is especially useful in large orgs where you want to quickly see "where is the work happening right now?" Click Org Chart in the toggle to switch from the network graph to a traditional org chart. The org chart is better for: The Recent Activity section on the dashboard homepage shows you a real-time stream of events as they happen across your org.

Event type

What it means ["🤖", "Agent event", "Agent was created, activated, or changed status"], ["✅", "Task event", "Task was created, updated, or completed"], ["💰", "Credit event", "Credits were earned or spent"], ["⚡", "General event", "System-level events"], ].map(([icon, type, meaning]) => (

Each event shows:

Who — the agent or system that caused it

What — a human-readable description of what happened

When — relative timestamp (or event order at high speeds)

Badge — color-coded status (success, warning, etc.) Using the Live Feed for Debugging The live feed is your first stop when something seems wrong. Common patterns:

Work isn't progressing Look for a gap in events. If you see "Task assigned to Backend Worker" but no subsequent progress events from that agent, the agent may be stuck. Check the agent's detail panel (click its node in the network graph).

Too many escalations If you see a stream of escalation events from the same agent, that agent is consistently blocked. Open the escalation history to see the reason — usually it's a missing resource or a task that's outside the agent's domain.

## Agent Detail Panel

Credit burn spike A sudden jump in credit events means one or more agents are making many LLM calls. This might mean they're working hard (good) or looping on a confused task (investigate). Click "See all →" next to Recent Activity to open the full Events page with filtering, search, and pagination. Click any agent in the network graph or agents list to open their

### Overview Tab

detail panel on the right side.

Shows the agent's key stats at a glance:

Status — Active, Pending, Paused, Suspended

Level — Their position in the hierarchy (L1–L10)

Trust Score — 0-100 score based on task success rate

Success Rate — % of assigned tasks completed successfully

Current Task — What they're working on right

Credits — Current balance and spend history

### Tasks Tab

Parent — Who manages this agent (click to open their detail) All tasks assigned to this agent — past and present. Filter by status:

In Progress — Active work

Blocked — Waiting for something

Done — Completed

### Messages Tab

### Activity Timeline

## Tasks Page

### Task States

Cancelled — Abandoned Clicking a task shows its full activity log — every progress update, escalation, and message related to that task. Every ACP message this agent has sent or received, grouped by conversation partner: This is how you understand the "why" behind what an agent did. If an agent marked a task done but the output seems wrong, the messages tab shows you the conversation that led there. The Timeline tab shows a visual history of this agent's activity — when they were working, when they were idle, task transitions. Useful for spotting patterns like "this agent is always idle on weekday mornings" or "this agent had a 2-hour gap with no activity." Navigate to Tasks for a full list of all tasks across your org.

### Task Detail

Meaning ["Backlog", "Gray", "Not yet assigned"], ["To Do", "Amber", "Assigned but not started"], ["In Progress", "Cyan", "Agent is actively working"], ["Review", "Purple", "Waiting for approval"], ["Done", "Green", "Completed"], ["Blocked", "Red", "Escalation pending"], ["Cancelled", "Red", "Abandoned"], ].map(([state, color, meaning]) => ( The Tasks by Status chart on the dashboard homepage shows the distribution across all states at a glance. Healthy orgs have most tasks in "In Progress" or "Done." An org with many tasks stuck in "Blocked" or "Backlog" needs attention.

Clicking a task shows:

Description — What was asked

Assigned to — Which agent owns it

Activity log — Every progress update in chronological order

ACP reactions — 👍 acks and ✅ completions shown on the task header

## Messages Page

Escalation history — Full chain if the task was escalated Navigate to Messages to see all ACP communication across your org.

The messages page shows:

Message types you'll see:

## Credit Tracking

Meaning ["ack", "Cyan", "Task acknowledgment"], ["progress", "Blue", "Progress update written to task log"], ["escalation", "Red/Orange", "Blocker or question from agent to manager"], ["completion", "Green", "Task done notification"], ["delegation", "Purple", "Task assigned by manager to agent"], ].map(([type, color, meaning]) => ( Navigate to Credits for a full breakdown of credit usage across your org. The Credit Flow chart on the dashboard shows earned vs. spent credits over time:

Green line — credits earned (tasks completed, work produced)

Amber line — credits spent (LLM API calls, tool usage) A healthy org has these roughly balanced, or earned slightly exceeding spent. If the spent line sharply exceeds earned, investigate which agents are consuming credits without completing tasks. The credits page also shows per-agent breakdowns — which agent is spending the most? This helps you right-size model choices: if a L4 worker is consistently using claude-opus, switching to claude-haiku might cut your costs without affecting output quality. Using the Dashboard for Debugging Here's a practical debugging workflow when something isn't right in your org: "Work has stopped. Nothing is completing." Open the Network graph → look for red (hot) or bottlenecked nodes Check ACP Metrics → is escalation rate high? Completion rate low? Open Recent Activity → look for the last event. What was it? Click the stuck agent → Tasks tab → find the blocked task Read the activity log → what did the agent last say? Check the escalation — did they escalate? Did their manager respond? "Agents are escalating constantly." Open Messages → filter by type:

escalation Read the escalation reasons — are they BLOCKED,

OUT_OF_DOMAIN, or

LOW_CONFIDENCE?

BLOCKED → agent needs a resource. Provide it.

OUT_OF_DOMAIN → task is routed to wrong agent. Fix routing in ORG.md.

LOW_CONFIDENCE → agent description is too vague. Improve the role prose. "Credit burn is unexpectedly high."

Credits page → sort by agent spend

Tasks tab → how many tasks? What types?

Activity log → are they looping? Making progress each cycle or spinning? "The org works but output quality is low."

## Dashboard Customization

Tasks tab → find recently completed tasks Check the trust scores — low-trust agents produce lower-quality work. Assign them simpler tasks. The dashboard grid is customizable. Use the

toolbar (top right of dashboard) to:

Show/hide widgets — turn off charts you don't need

Rearrange — drag widgets into the order that works for you

Apply a preset — pre-configured layouts for different use cases (Ops, Engineering, Executive)

## Keyboard Shortcuts

Reset — restore the default layout Your layout is saved per-browser and persists across sessions.

Shortcut

## Next Steps

Action ["Cmd/Ctrl + K", "Open command palette"], ["N", "Go to Network page"], ["A", "Go to Agents page"], ["T", "Go to Tasks page"], ["M", "Go to Messages page"], ["Esc", "Close any open panel"], ].map(([shortcut, action]) => ( to="/docs/guides/connecting-agents"

Connecting Real Agents →

Add LLM-powered agents to your org to="/docs/concepts/acp-vs-a2a"

ACP vs A2A → Understand the protocol behind what you're watching to="/docs/tutorials/your-first-org-md"

ORG.md Reference →

Edit your org structure
