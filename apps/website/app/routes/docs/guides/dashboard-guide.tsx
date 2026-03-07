import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { Callout } from "../../../components/callout";
import { useTitle } from "../../../hooks/use-title";

export function DashboardGuide() {
  useTitle("Dashboard Guide");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Dashboard Guide</h1>
      <p className="mb-8 text-lg text-slate-400">
        How to use the OpenSpawn dashboard to monitor your org, debug problems, and understand what
        your agents are doing.
      </p>

      <Callout className="mb-8">
        Your agent org is running. The dashboard shows you exactly what's happening — in real time.
      </Callout>

      <p className="mb-8 text-slate-400">
        The OpenSpawn dashboard gives you a live window into your multi-agent org: who's working,
        what they're doing, where work is flowing, and where it's getting stuck. This guide covers
        every major view and how to use it.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Dashboard Overview */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Dashboard Overview</h2>
      <p className="mb-4 text-slate-400">
        When you open the dashboard, you land on the{" "}
        <strong className="text-slate-200">main overview page</strong>. This page gives you a
        high-level pulse on your org at a glance.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Stats Bar</h3>
      <p className="mb-4 text-slate-400">
        Four stat cards at the top summarize your org's current state:
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Stat</th>
              <th className="py-2 text-left font-semibold text-slate-300">What it means</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              [
                "Active Agents",
                "Agents currently in ACTIVE status. +N pending = agents waiting to be activated.",
              ],
              ["Tasks In Progress", "Tasks your agents are actively working on right now."],
              ["Completed Tasks", "Total tasks that have reached DONE status."],
              ["Credit Flow", "Net credits earned vs. spent across all agents."],
            ].map(([stat, meaning]) => (
              <tr key={stat}>
                <td className="py-2 pr-6 font-semibold text-slate-300">{stat}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        Each stat card includes a sparkline (mini chart) showing the trend over recent periods — you
        can see at a glance if things are accelerating, slowing down, or stable.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">ACP Metrics (Live Orgs)</h3>
      <p className="mb-4 text-slate-400">
        When you're connected to a live sandbox or real org, the dashboard shows a second row of{" "}
        <strong className="text-slate-200">protocol-level metrics</strong> — the health indicators
        from the Agent Communication Protocol:
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Metric</th>
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Healthy</th>
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Warning</th>
              <th className="py-2 text-left font-semibold text-slate-300">What to do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Ack Latency", "< 500ms", "> 2s", "Agent may be overwhelmed or API is slow"],
              [
                "Escalation Rate",
                "< 10%",
                "> 30%",
                "Tasks are poorly routed or agents lack capabilities",
              ],
              ["Avg Delegation Depth", "2-3 levels", "5+ levels", "Org may be over-hierarchical"],
              ["Completion Rate", "> 90%", "< 70%", "Something is blocking work from finishing"],
            ].map(([metric, healthy, warning, action]) => (
              <tr key={metric}>
                <td className="py-2 pr-4 font-semibold text-slate-300">{metric}</td>
                <td className="py-2 pr-4 text-green-400">{healthy}</td>
                <td className="py-2 pr-4 text-amber-400">{warning}</td>
                <td className="py-2">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        These four numbers tell you more about org health than any individual agent's status. An
        escalation rate spike usually means something changed: a new task type arrived that no agent
        knows how to handle, or a resource (API key, file access) went missing.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Network Graph */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Network Graph</h2>
      <p className="mb-4 text-slate-400">
        Navigate to <strong className="text-slate-200">Network</strong> in the sidebar. This is the
        most powerful view in the dashboard.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">What You're Looking At</h3>
      <p className="mb-4 text-slate-400">
        The network graph shows your{" "}
        <strong className="text-slate-200">entire org hierarchy</strong> as a live, interactive
        visualization. Each node is an agent; each edge is a reporting relationship.
      </p>
      <CodeBlock title="org structure">{`          👤 Human
              │
         🤖 COO (L10)
        /         \\
  🤖 Eng Lead    🤖 Marketing Lead
  (L7)           (L7)
  /   \\              \\
🤖    🤖           🤖 🤖 🤖
(L4) (L4)        (L4)(L4)(L4)`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The real graph is interactive — you can pan, zoom, and click any node to open its detail
        panel.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Reading Agent Colors (Heat Map)
      </h3>
      <p className="mb-3 text-slate-400">
        Agent node color tells you how active each agent currently is:
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Color</th>
              <th className="py-2 text-left font-semibold text-slate-300">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["🔴 Red (Hot)", "Very busy — many tasks, high message volume"],
              ["🟠 Orange (Warm)", "Actively working"],
              ["🔵 Cyan (Cool)", "Light activity — working but not stressed"],
              ["⬛ Slate (Idle)", "No active tasks"],
              ["🔵 Cyan (Human)", "The human principal (always cyan)"],
            ].map(([color, meaning]) => (
              <tr key={color}>
                <td className="py-2 pr-6">{color}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        At a glance, you can see if work is spreading across the org (good) or bottlenecked at one
        node (worth investigating).
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Reading Edges</h3>
      <p className="mb-3 text-slate-400">
        The lines connecting agents aren't just decorative — they carry information:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Thickness</strong> → message volume. Thicker edges mean
          more ACP messages flowing between those two agents.
        </li>
        <li>
          <strong className="text-slate-200">Dashed</strong> → no recent communication on this
          relationship.
        </li>
        <li>
          <strong className="text-slate-200">Animated particles</strong> → active task delegation
          happening right now.
        </li>
        <li>
          <strong className="text-slate-200">Color</strong> → matches the activity level of the
          downstream agent.
        </li>
      </ul>
      <p className="mb-4 text-slate-400">
        When you see a very thick edge to one particular worker, that worker may be overloaded. When
        you see a delegation animation that keeps happening between the same two nodes, that's a
        high-traffic relationship worth watching.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Clicking an Edge</h3>
      <p className="mb-4 text-slate-400">
        Click any edge to open an <strong className="text-slate-200">edge tooltip</strong> showing:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>Total messages exchanged between those two agents</li>
        <li>The last message content and when it was sent</li>
      </ul>
      <p className="mb-4 text-slate-400">
        This is useful for debugging: "Why are these two agents talking so much?" or "Has this
        relationship been silent for a long time?"
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Level Badges</h3>
      <p className="mb-3 text-slate-400">
        Each agent node shows an <strong className="text-slate-200">L badge</strong> (L1–L10)
        indicating their organizational level:
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Level</th>
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Color</th>
              <th className="py-2 text-left font-semibold text-slate-300">Role type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["L10", "Pink", "COO / CEO"],
              ["L9", "Purple", "VP / Director"],
              ["L7–8", "Green", "Manager / Lead"],
              ["L5–6", "Cyan", "Senior"],
              ["L3–4", "Yellow", "Worker / Engineer"],
              ["L1–2", "Gray", "Junior / Probation"],
            ].map(([level, color, role]) => (
              <tr key={level}>
                <td className="py-2 pr-6 font-semibold text-slate-300">{level}</td>
                <td className="py-2 pr-6">{color}</td>
                <td className="py-2">{role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        Higher levels can delegate; lower levels execute. If a task needs to be escalated, it flows
        upward through these levels.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Task Count Badge</h3>
      <p className="mb-4 text-slate-400">
        Each agent also shows a <strong className="text-slate-200">purple task badge</strong> with
        the number of tasks currently assigned to it. An agent with a task count of 8+ when others
        are at 0 is a bottleneck — the org may need another worker in that domain.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Compact Mode &amp; Dim Idle
      </h3>
      <p className="mb-4 text-slate-400">
        Two toggle buttons in the top-left of the network graph help you focus:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">▫ Compact</strong> — shrinks nodes so you can see
          larger orgs without scrolling
        </li>
        <li>
          <strong className="text-slate-200">◑ Dim Idle</strong> — fades out idle agents, focusing
          attention on active ones
        </li>
      </ul>
      <p className="mb-4 text-slate-400">
        Dim Idle is especially useful in large orgs where you want to quickly see "where is the work
        happening right now?"
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Org Chart View</h3>
      <p className="mb-4 text-slate-400">
        Click <strong className="text-slate-200">Org Chart</strong> in the toggle to switch from the
        network graph to a traditional org chart. The org chart is better for:
      </p>
      <ul className="mb-8 list-disc pl-6 text-slate-400 space-y-1">
        <li>Understanding reporting relationships at a glance</li>
        <li>Seeing team groupings</li>
        <li>Sharing with stakeholders who aren't familiar with the network view</li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* Live Feed */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Live Feed</h2>
      <p className="mb-4 text-slate-400">
        The <strong className="text-slate-200">Recent Activity</strong> section on the dashboard
        homepage shows you a real-time stream of events as they happen across your org.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Event Types</h3>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Icon</th>
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Event type</th>
              <th className="py-2 text-left font-semibold text-slate-300">What it means</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["🤖", "Agent event", "Agent was created, activated, or changed status"],
              ["✅", "Task event", "Task was created, updated, or completed"],
              ["💰", "Credit event", "Credits were earned or spent"],
              ["⚡", "General event", "System-level events"],
            ].map(([icon, type, meaning]) => (
              <tr key={type}>
                <td className="py-2 pr-4 text-xl">{icon}</td>
                <td className="py-2 pr-4">{type}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-3 text-slate-400">Each event shows:</p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Who</strong> — the agent or system that caused it
        </li>
        <li>
          <strong className="text-slate-200">What</strong> — a human-readable description of what
          happened
        </li>
        <li>
          <strong className="text-slate-200">When</strong> — relative timestamp (or event order at
          high speeds)
        </li>
        <li>
          <strong className="text-slate-200">Badge</strong> — color-coded status (success, warning,
          etc.)
        </li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Using the Live Feed for Debugging
      </h3>
      <p className="mb-4 text-slate-400">
        The live feed is your first stop when something seems wrong. Common patterns:
      </p>
      <div className="mb-6 space-y-4">
        <div>
          <p className="mb-1 font-semibold text-slate-300">Work isn't progressing</p>
          <p className="text-slate-400">
            Look for a gap in events. If you see "Task assigned to Backend Worker" but no subsequent
            progress events from that agent, the agent may be stuck. Check the agent's detail panel
            (click its node in the network graph).
          </p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-300">Too many escalations</p>
          <p className="text-slate-400">
            If you see a stream of escalation events from the same agent, that agent is consistently
            blocked. Open the escalation history to see the reason — usually it's a missing resource
            or a task that's outside the agent's domain.
          </p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-300">Credit burn spike</p>
          <p className="text-slate-400">
            A sudden jump in credit events means one or more agents are making many LLM calls. This
            might mean they're working hard (good) or looping on a confused task (investigate).
          </p>
        </div>
      </div>
      <p className="mb-4 text-slate-400">
        Click <strong className="text-slate-200">"See all →"</strong> next to Recent Activity to
        open the full Events page with filtering, search, and pagination.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Agent Detail Panel */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Agent Detail Panel</h2>
      <p className="mb-4 text-slate-400">
        Click any agent in the network graph or agents list to open their{" "}
        <strong className="text-slate-200">detail panel</strong> on the right side.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Overview Tab</h3>
      <p className="mb-3 text-slate-400">Shows the agent's key stats at a glance:</p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Status</strong> — Active, Pending, Paused, Suspended
        </li>
        <li>
          <strong className="text-slate-200">Level</strong> — Their position in the hierarchy
          (L1–L10)
        </li>
        <li>
          <strong className="text-slate-200">Trust Score</strong> — 0-100 score based on task
          success rate
        </li>
        <li>
          <strong className="text-slate-200">Success Rate</strong> — % of assigned tasks completed
          successfully
        </li>
        <li>
          <strong className="text-slate-200">Current Task</strong> — What they're working on right
          now
        </li>
        <li>
          <strong className="text-slate-200">Credits</strong> — Current balance and spend history
        </li>
        <li>
          <strong className="text-slate-200">Parent</strong> — Who manages this agent (click to open
          their detail)
        </li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Tasks Tab</h3>
      <p className="mb-3 text-slate-400">
        All tasks assigned to this agent — past and present. Filter by status:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">In Progress</strong> — Active work
        </li>
        <li>
          <strong className="text-slate-200">Blocked</strong> — Waiting for something
        </li>
        <li>
          <strong className="text-slate-200">Done</strong> — Completed
        </li>
        <li>
          <strong className="text-slate-200">Cancelled</strong> — Abandoned
        </li>
      </ul>
      <p className="mb-4 text-slate-400">
        Clicking a task shows its full activity log — every progress update, escalation, and message
        related to that task.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Messages Tab</h3>
      <p className="mb-3 text-slate-400">
        Every ACP message this agent has sent or received, grouped by conversation partner:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>Messages to/from their manager</li>
        <li>Messages to/from each direct report</li>
        <li>Escalation threads</li>
      </ul>
      <p className="mb-4 text-slate-400">
        This is how you understand the "why" behind what an agent did. If an agent marked a task
        done but the output seems wrong, the messages tab shows you the conversation that led there.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Activity Timeline</h3>
      <p className="mb-4 text-slate-400">
        The <strong className="text-slate-200">Timeline</strong> tab shows a visual history of this
        agent's activity — when they were working, when they were idle, task transitions. Useful for
        spotting patterns like "this agent is always idle on weekday mornings" or "this agent had a
        2-hour gap with no activity."
      </p>

      <hr className="my-8 border-white/10" />

      {/* Tasks Page */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Tasks Page</h2>
      <p className="mb-4 text-slate-400">
        Navigate to <strong className="text-slate-200">Tasks</strong> for a full list of all tasks
        across your org.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Task States</h3>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">State</th>
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Color</th>
              <th className="py-2 text-left font-semibold text-slate-300">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Backlog", "Gray", "Not yet assigned"],
              ["To Do", "Amber", "Assigned but not started"],
              ["In Progress", "Cyan", "Agent is actively working"],
              ["Review", "Purple", "Waiting for approval"],
              ["Done", "Green", "Completed"],
              ["Blocked", "Red", "Escalation pending"],
              ["Cancelled", "Red", "Abandoned"],
            ].map(([state, color, meaning]) => (
              <tr key={state}>
                <td className="py-2 pr-6 font-semibold text-slate-300">{state}</td>
                <td className="py-2 pr-6">{color}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        The <strong className="text-slate-200">Tasks by Status</strong> chart on the dashboard
        homepage shows the distribution across all states at a glance. Healthy orgs have most tasks
        in "In Progress" or "Done." An org with many tasks stuck in "Blocked" or "Backlog" needs
        attention.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Task Detail</h3>
      <p className="mb-3 text-slate-400">Clicking a task shows:</p>
      <ul className="mb-8 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Description</strong> — What was asked
        </li>
        <li>
          <strong className="text-slate-200">Assigned to</strong> — Which agent owns it
        </li>
        <li>
          <strong className="text-slate-200">Activity log</strong> — Every progress update in
          chronological order
        </li>
        <li>
          <strong className="text-slate-200">ACP reactions</strong> — 👍 acks and ✅ completions
          shown on the task header
        </li>
        <li>
          <strong className="text-slate-200">Escalation history</strong> — Full chain if the task
          was escalated
        </li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* Messages Page */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Messages Page</h2>
      <p className="mb-4 text-slate-400">
        Navigate to <strong className="text-slate-200">Messages</strong> to see all ACP
        communication across your org.
      </p>
      <p className="mb-3 text-slate-400">The messages page shows:</p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>A conversation graph (network view of who talks to whom)</li>
        <li>Filterable list by agent, message type, and time</li>
        <li>Thread view — click any conversation to see the full message exchange</li>
      </ul>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Message types you'll see:</strong>
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Type</th>
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Color</th>
              <th className="py-2 text-left font-semibold text-slate-300">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["ack", "Cyan", "Task acknowledgment"],
              ["progress", "Blue", "Progress update written to task log"],
              ["escalation", "Red/Orange", "Blocker or question from agent to manager"],
              ["completion", "Green", "Task done notification"],
              ["delegation", "Purple", "Task assigned by manager to agent"],
            ].map(([type, color, meaning]) => (
              <tr key={type}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{type}</code>
                </td>
                <td className="py-2 pr-4">{color}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* Credit Tracking */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Credit Tracking</h2>
      <p className="mb-4 text-slate-400">
        Navigate to <strong className="text-slate-200">Credits</strong> for a full breakdown of
        credit usage across your org.
      </p>
      <p className="mb-3 text-slate-400">
        The <strong className="text-slate-200">Credit Flow</strong> chart on the dashboard shows
        earned vs. spent credits over time:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Green line</strong> — credits earned (tasks completed,
          work produced)
        </li>
        <li>
          <strong className="text-slate-200">Amber line</strong> — credits spent (LLM API calls,
          tool usage)
        </li>
      </ul>
      <p className="mb-4 text-slate-400">
        A healthy org has these roughly balanced, or earned slightly exceeding spent. If the spent
        line sharply exceeds earned, investigate which agents are consuming credits without
        completing tasks.
      </p>
      <p className="mb-8 text-slate-400">
        The credits page also shows <strong className="text-slate-200">per-agent breakdowns</strong>{" "}
        — which agent is spending the most? This helps you right-size model choices: if a L4 worker
        is consistently using claude-opus, switching to claude-haiku might cut your costs without
        affecting output quality.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Debugging */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Using the Dashboard for Debugging
      </h2>
      <p className="mb-4 text-slate-400">
        Here's a practical debugging workflow when something isn't right in your org:
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        "Work has stopped. Nothing is completing."
      </h3>
      <ol className="mb-6 list-decimal pl-6 text-slate-400 space-y-2">
        <li>
          Open the <strong className="text-slate-200">Network graph</strong> → look for red (hot) or
          bottlenecked nodes
        </li>
        <li>
          Check <strong className="text-slate-200">ACP Metrics</strong> → is escalation rate high?
          Completion rate low?
        </li>
        <li>
          Open <strong className="text-slate-200">Recent Activity</strong> → look for the last
          event. What was it?
        </li>
        <li>
          Click the stuck agent → <strong className="text-slate-200">Tasks tab</strong> → find the
          blocked task
        </li>
        <li>
          Read the <strong className="text-slate-200">activity log</strong> → what did the agent
          last say?
        </li>
        <li>
          Check the <strong className="text-slate-200">escalation</strong> — did they escalate? Did
          their manager respond?
        </li>
      </ol>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        "Agents are escalating constantly."
      </h3>
      <ol className="mb-6 list-decimal pl-6 text-slate-400 space-y-2">
        <li>
          Open <strong className="text-slate-200">Messages</strong> → filter by type:{" "}
          <code className="inline-code">escalation</code>
        </li>
        <li>
          Read the escalation reasons — are they <code className="inline-code">BLOCKED</code>,{" "}
          <code className="inline-code">OUT_OF_DOMAIN</code>, or{" "}
          <code className="inline-code">LOW_CONFIDENCE</code>?
        </li>
        <li>
          <code className="inline-code">BLOCKED</code> → agent needs a resource. Provide it.
        </li>
        <li>
          <code className="inline-code">OUT_OF_DOMAIN</code> → task is routed to wrong agent. Fix
          routing in ORG.md.
        </li>
        <li>
          <code className="inline-code">LOW_CONFIDENCE</code> → agent description is too vague.
          Improve the role prose.
        </li>
      </ol>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        "Credit burn is unexpectedly high."
      </h3>
      <ol className="mb-6 list-decimal pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Credits page</strong> → sort by agent spend
        </li>
        <li>Find the top spender — click to open detail panel</li>
        <li>
          <strong className="text-slate-200">Tasks tab</strong> → how many tasks? What types?
        </li>
        <li>
          <strong className="text-slate-200">Activity log</strong> → are they looping? Making
          progress each cycle or spinning?
        </li>
        <li>If spinning: improve the role description to give clearer guidance on when to stop</li>
      </ol>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        "The org works but output quality is low."
      </h3>
      <ol className="mb-6 list-decimal pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Tasks tab</strong> → find recently completed tasks
        </li>
        <li>Read the activity logs — are agents skipping steps?</li>
        <li>Check the role description — does it specify quality criteria?</li>
        <li>
          Check the trust scores — low-trust agents produce lower-quality work. Assign them simpler
          tasks.
        </li>
      </ol>

      <hr className="my-8 border-white/10" />

      {/* Customization */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Dashboard Customization</h2>
      <p className="mb-4 text-slate-400">
        The dashboard grid is customizable. Use the{" "}
        <strong className="text-slate-200">toolbar</strong> (top right of dashboard) to:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Show/hide widgets</strong> — turn off charts you don't
          need
        </li>
        <li>
          <strong className="text-slate-200">Rearrange</strong> — drag widgets into the order that
          works for you
        </li>
        <li>
          <strong className="text-slate-200">Apply a preset</strong> — pre-configured layouts for
          different use cases (Ops, Engineering, Executive)
        </li>
        <li>
          <strong className="text-slate-200">Reset</strong> — restore the default layout
        </li>
      </ul>
      <p className="mb-8 text-slate-400">
        Your layout is saved per-browser and persists across sessions.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Keyboard Shortcuts */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Keyboard Shortcuts</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-8 text-left font-semibold text-slate-300">Shortcut</th>
              <th className="py-2 text-left font-semibold text-slate-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Cmd/Ctrl + K", "Open command palette"],
              ["N", "Go to Network page"],
              ["A", "Go to Agents page"],
              ["T", "Go to Tasks page"],
              ["M", "Go to Messages page"],
              ["Esc", "Close any open panel"],
            ].map(([shortcut, action]) => (
              <tr key={shortcut}>
                <td className="py-2 pr-8">
                  <code className="inline-code">{shortcut}</code>
                </td>
                <td className="py-2">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* Next Steps */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Next Steps</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/docs/guides/connecting-agents"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Connecting Real Agents →</div>
          <div className="text-xs text-slate-500">Add LLM-powered agents to your org</div>
        </Link>
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ACP vs A2A →</div>
          <div className="text-xs text-slate-500">
            Understand the protocol behind what you're watching
          </div>
        </Link>
        <Link
          to="/docs/tutorials/your-first-org-md"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ORG.md Reference →</div>
          <div className="text-xs text-slate-500">Edit your org structure</div>
        </Link>
      </div>
    </DocsLayout>
  );
}
