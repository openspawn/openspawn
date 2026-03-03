---
source: https://openspawn.ai/docs/concepts/acp-vs-a2a
generated: 2026-03-03
---

# ACP vs A2A

## The Short Version

## ACP: Communication Inside Your Org

### What ACP Defines

When to use OpenSpawn's Agent Communication Protocol versus Google's Agent-to-Agent protocol — and how they work together. Two protocols, two jobs. One for inside your org, one for talking to the outside world. If you've read about multi-agent systems, you've probably encountered Google's A2A (Agent-to-Agent) protocol. OpenSpawn uses a different protocol internally — ACP (Agent Communication Protocol). They're not competitors. They're designed for different problems and work together. ["Stands for", "Agent Communication Protocol", "Agent-to-Agent Protocol"], ["Created by", "OpenSpawn", "Google (open standard)"], ["Scope", "Inside your org", "Between orgs / external agents"], ["Trust model", "Known agents, shared state", "Zero-trust, opaque agents"], ["Analogy", "Slack (team chat)", "Email (cross-company)"], ["Best for", "Manager ↔ worker communication", "Your org ↔ external AI service"], ].map(([label, acp, a2a]) => ( ACP governs how agents within a single OpenSpawn org communicate with each other. It's built around a core insight: agents in the same org already know each other, share context, and exist in a trust hierarchy. You shouldn't need to treat your own backend worker like an opaque third-party service. ACP specifies four message types, each with a specific purpose:

1. Acknowledgment (ACK) Pull-based log entry written to the task as work progresses. The manager checks when they want to.

3. Escalation Push notification when an agent is blocked. Goes directly to the manager. Actionable.

### Why This Matters

### What ACP Doesn't Do

## A2A: Communication Between Orgs

### What A2A Defines

4. Completion Task done signal with a brief summary. Manager can proceed with dependent work. Most multi-agent frameworks have no communication model at all — tasks go in, results come out, and the delegator just waits. ACP gives you: ACP is not for talking to external systems. It assumes: When you need to communicate outside your org — to another company's agent, a third-party AI service, or an external agent built on a different framework — you need A2A. Google's A2A protocol is an open standard for inter-agent communication across organizational and vendor boundaries. It answers the question: "How does my LangGraph agent talk to your CrewAI agent, when we can't assume shared infrastructure?"

Agent Cards

```
"name": "data-analyst-agent",
"description": "Analyzes datasets and produces reports",
"url": "https://agents.example.com/analyst",
"capabilities": {
"streaming": true,
"pushNotifications": false
},
"skills": [
{ "id": "data-analysis", "name": "Data Analysis", "tags": ["csv", "sql", "charts"] },
{ "id": "report-gen", "name": "Report Generation" }
]
```

Discovery metadata that describes what an agent can do:

```
↓
```

Tasks — stateful work units with a lifecycle:

Transport — JSON-RPC 2.0 over HTTPS, with optional gRPC and SSE for streaming.

Message format

```
"role": "agent",
"parts": [
{ "kind": "text", "text": "Analysis complete. Found 3 anomalies in the dataset." },
{ "kind": "file", "file": { "name": "report.pdf", "mimeType": "application/pdf", "uri": "..." } }
]
```

### What A2A Doesn't Do

## Side-by-Side Comparison

Generic Message objects containing typed Parts: A2A is deliberately opaque — it doesn't assume you know anything about the internal structure of the agent you're talking to. There's no concept of trust scores, hierarchy, delegation depth, or escalation chains. Two agents can exchange tasks over A2A without either knowing whether the other is a single model, a multi-agent team, or a human pretending to be a bot. This opacity is a feature, not a limitation. You don't want to expose your internal org structure to a third-party service.

### The Key Philosophical Difference

Dimension ["Scope", "Intra-org", "Inter-org"], ["Trust model", "Known agents, trust scores", "Zero-trust"], ["Agent discovery", "Org chart / hierarchy", "Agent Cards (JSON metadata)"], ["Transport", "Internal events, SSE", "JSON-RPC 2.0, gRPC, REST"], ["Task lifecycle", "Stateful (same as A2A)", "Stateful"], ["Streaming", "SSE", "SSE (similar)"], ["Message types", "Typed: ack, progress, escalation, completion", "Generic: Message with Parts"], ["Hierarchy", "First-class (parent, level, chain of command)", "Flat (peer-to-peer)"], ["Organizational metrics", "Built-in (escalation rate, ack latency, etc.)", "Not defined"], ["Delegation chain", "Tracked and surfaced", "Not defined"], ].map(([dim, acp, a2a]) => (

ACP assumes transparency. Within your org, shared context improves outcomes. Your backend worker should know the org is a startup that moves fast. Your engineering lead should know which workers have the highest trust scores for hard tasks. Opacity within your own org creates the same dysfunctions as opacity in human organizations.

A2A assumes opacity. Across org boundaries, you don't want to expose your internal state, and you can't trust the other party's trust model. Two agents that have never met need a common protocol that doesn't require shared infrastructure.

## When to Use Which

Together they cover the full spectrum: transparent internally (ACP), opaque externally (A2A).

Use ACP when:

### In Practice: Both at Once

```
│ Your OpenSpawn Org │
│ │
│ COO ──ACP──► Eng Lead ──ACP──► Worker │
│ │ │
│ │ Internal communication: ACP │
│ │ (typed messages, shared context, │
│ │ trust scores, escalation chains) │
│ │
│ ▼ │
│ A2A Gateway │
│ │ │
└───┼──────────────────────────────────────────┘
│
│ External communication: A2A
│ (Agent Cards, JSON-RPC, zero-trust)
▼
┌──────────────┐ ┌──────────────────────────┐
│ External │ │ External Agent B │
│ Agent A │ │ (LangGraph / CrewAI / │
│ (vendor API) │ │ another OpenSpawn org) │
```

Use A2A when: Most real OpenSpawn deployments use both: The A2A Gateway sits at the org boundary and translates between the two protocols:

Inbound (A2A → ACP): External agent sends an A2A task → Gateway creates an internal ACP delegation to the right agent based on skill/domain matching.

Outbound (ACP → A2A): Internal agent escalates with

OUT_OF_DOMAIN → Gateway discovers external agents via Agent Cards and sends an A2A request.

## Code Examples

### ACP: Handling an Escalation

```
id: "msg-789",
type: "escalation",
from: "agent-backend-1",
to: "agent-lead-eng",
taskId: "task-42",
reason: "BLOCKED",
body: "Need JWT secret to test the fix — not in .env",
timestamp: "2024-01-15T10:30:00Z"
};
// The manager agent receives this and decides:
// - Provide the resource (unblock)
// - Reassign to a different agent
// - Escalate further up the chain
```

### A2A: Sending a Task to an External Agent

```
jsonrpc: "2.0",
method: "tasks/send",
id: "req-001",
params: {
id: "task-ext-42",
message: {
role: "user",
parts: [
{
kind: "text",
text: "Analyze this sales dataset and produce a trend report. " +
"Focus on Q4 performance and identify top 3 growth segments."
},
{
kind: "file",
file: {
name: "sales-q4.csv",
mimeType: "text/csv",
uri: "https://data.yourorg.com/exports/sales-q4.csv"
]
};
// Stream the response
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(request)
});
// Response is a Task object:
// { id, status: "working", ... }
```

### A2A + ACP: A Task That Crosses the Boundary

```
// ACP delegation: COO → Data Lead → Data Worker (internal, via ACP)
// Step 2: Data Worker determines this needs external specialist
// ACP escalation: { reason: "OUT_OF_DOMAIN", body: "Need specialized ML model for time-series" }
// Step 3: A2A Gateway receives escalation
// Discovers external ML agent via Agent Card matching skill: "time-series-analysis"
// Step 4: A2A task sent to external agent
// External agent processes, streams updates back
// Step 5: A2A completion received by Gateway
// Gateway creates ACP completion message back to Data Lead
// ACP completion: { summary: "Time-series analysis complete. Report attached." }
// Step 6: ACP completion flows up to COO
```

## How They Complement Each Other

Status mapping: ACP completion/escalation → A2A task status updates. When an agent in your org escalates, you see this in the ACP message stream: When your org delegates to an external service, it goes via A2A: ACP and A2A are designed to be used together, and they share some structural similarities that make integration natural:

### Future: ACP as an A2A Extension

```
"name": "openspawn-org-agent",
"extensions": [
{
"uri": "urn:openspawn:acp:v1",
"required": false,
"config": {
"supportsAck": true,
"supportsProgress": true,
"supportsEscalation": true,
"escalationReasons": ["BLOCKED", "OUT_OF_DOMAIN", "LOW_CONFIDENCE"]
]
```

## Summary

Similarity ["Stateful tasks", "✅ Full lifecycle", "✅ Full lifecycle"], ["Streaming updates", "✅ SSE-based", "✅ SSE-based"], ["Task history", "✅ Activity log", "✅ Task messages list"], ].map(([sim, acp, a2a]) => ( The main difference is in the communication model: ACP is typed and hierarchical; A2A is generic and flat. A2A supports an extension mechanism for additional capabilities. ACP message semantics — typed acks, escalations, and completions — could be formalized as an A2A extension, allowing A2A-compatible agents to opt into richer intra-org communication: This would let any A2A-compatible framework gradually adopt ACP semantics — getting richer organizational communication without abandoning A2A compatibility. You don't have to choose between ACP and A2A. They solve different problems:

ACP makes your org's internal communication structured, visible, and debuggable. It's the reason you can look at an escalation rate dashboard and know your engineering team is struggling.

## Further Reading

A2A makes your org interoperable with the broader agent ecosystem. It's the reason your OpenSpawn org can call a LangGraph agent or accept tasks from a CrewAI pipeline without either side knowing the other's internals. Think of it this way: ACP is how your team works. A2A is how your team works with everyone else. to="/docs/guides/connecting-agents"

Connecting Real Agents →

How to configure ACP behavior in your ORG.md href="https://a2a-protocol.org" target="_blank" rel="noopener"

A2A Protocol Docs →

Google's official A2A specification to="/docs/guides/dashboard-guide"

Dashboard Guide →

See ACP metrics live in the dashboard to="/docs/protocols/a2a"

A2A Protocol Reference →

OpenSpawn's A2A implementation details
