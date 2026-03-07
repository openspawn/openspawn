import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { useTitle } from "../../hooks/use-title";

export function CommunicationProtocol() {
  useTitle("Communication Protocol");

  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Communication Protocol v1</h1>
      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        Every message costs money. This protocol eliminates the 40–60% of tokens agents waste on
        coordination overhead.
      </div>

      {/* ── The Problem ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Problem</h2>
      <p className="mb-4 text-slate-400">
        In multi-agent organizations, agents default to human-like conversation patterns:
        acknowledgments, echoing, courtesy, clarification loops. This wastes{" "}
        <strong className="text-slate-200">40–60%</strong> of total token spend on zero-value
        coordination overhead.
      </p>

      {/* ── Core Principles ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Core Principles</h2>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">1. Silence = Success</h3>
      <p className="mb-4 text-slate-400">
        If an agent receives a task and can do it, it does it—silently. No acknowledgment. No "on
        it!" The absence of a message <em>is</em> the confirmation.
      </p>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: How do I know an agent received my task?</strong>
        <br />
        A: You don't need to. Silence means working. <code className="inline-code">
          ESCALATION
        </code>{" "}
        means something's wrong.
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">2. Files Over Chat</h3>
      <p className="mb-4 text-slate-400">
        Agents share status by writing to shared workspace files, not by chatting about it. This
        creates a persistent, scannable record instead of a transient conversation.
      </p>
      <table className="w-full text-sm text-left border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-2 pr-6 text-slate-400 font-medium">Instead of…</th>
            <th className="py-2 pr-6 text-slate-400 font-medium">Write to…</th>
          </tr>
        </thead>
        <tbody className="text-slate-400">
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">"Here's my plan for the task"</td>
            <td className="py-2 pr-6">
              <code className="inline-code">PLAN.md</code>
            </td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">"I finished, here are the results"</td>
            <td className="py-2 pr-6">
              <code className="inline-code">RESULT.md</code>
            </td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">"Handing this off to you"</td>
            <td className="py-2 pr-6">
              <code className="inline-code">HANDOFF.md</code>
            </td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">"Can you review this?"</td>
            <td className="py-2 pr-6">
              <code className="inline-code">REVIEW.md</code>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: How should agents share status?</strong>
        <br />
        A: Write to shared workspace files. Never narrate status in chat.
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">3. Deterministic Routing</h3>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">ORG.md</code> defines who handles what. No LLM decides routing
        at runtime. Tasks go to the agent whose role matches the work.
      </p>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: How does a message reach the right agent?</strong>
        <br />
        A: <code className="inline-code">ORG.md</code> defines who handles what. No LLM decides
        routing at runtime.
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">4. Mention-Only Activation</h3>
      <p className="mb-4 text-slate-400">
        In group channels, agents respond <strong className="text-slate-200">only</strong> when
        explicitly mentioned. No volunteering. No "I can help with that!"
      </p>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: When should an agent respond in a group channel?
        </strong>
        <br />
        A: Only when explicitly mentioned. Never volunteer.
      </div>

      {/* ── Message Types ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Message Types</h2>
      <p className="mb-4 text-slate-400">
        Exactly <strong className="text-slate-200">4 message types</strong>. No ACK type. No CHAT
        type. If it doesn't fit one of these, it probably shouldn't be sent.
      </p>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">TASK</h3>
      <p className="mb-4 text-slate-400">
        Work assignment from lead to worker. Must include{" "}
        <strong className="text-slate-200">assignee</strong>,{" "}
        <strong className="text-slate-200">deliverable</strong>, and{" "}
        <strong className="text-slate-200">location</strong>. Recipient does{" "}
        <strong className="text-slate-200">NOT</strong> acknowledge.
      </p>
      <CodeBlock title="TASK example">
        {`@frontend-dev
TASK: Build the settings page
Deliverable: /apps/website/app/routes/settings.tsx
Requirements: Follow existing page patterns, include form validation`}
      </CodeBlock>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What if the task is unclear?</strong>
        <br />
        A: Send one <code className="inline-code">ESCALATION</code>. Do not start a conversation
        about it.
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">RESULT</h3>
      <p className="mb-4 text-slate-400">
        Deliverable notification. Only send when the lead won't check the output file on their own.
        Must reference where the work lives.
      </p>
      <CodeBlock title="RESULT example">
        {`@lead
RESULT: Settings page complete
Location: /apps/website/app/routes/settings.tsx
Notes: Added validation for all form fields`}
      </CodeBlock>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Should I send RESULT for every task?</strong>
        <br />
        A: No. Only if the lead needs notification and won't discover the output on their own.
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">ESCALATION</h3>
      <p className="mb-4 text-slate-400">
        Blocker requiring intervention. Must include{" "}
        <strong className="text-slate-200">what's blocked</strong>,{" "}
        <strong className="text-slate-200">why</strong>, and{" "}
        <strong className="text-slate-200">what's needed</strong>. Goes to nearest authority. If
        unresolved in 2 turns, escalate up.
      </p>
      <CodeBlock title="ESCALATION example">
        {`@lead
ESCALATION: Cannot complete settings page
Blocked: Missing API endpoint for user preferences
Need: Endpoint spec or decision to stub it`}
      </CodeBlock>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What counts as an escalation?</strong>
        <br />
        A: Anything preventing task completion. NOT "just checking in."
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">DECISION</h3>
      <p className="mb-4 text-slate-400">
        Resolution from lead. Must be <strong className="text-slate-200">definitive</strong> and
        must <strong className="text-slate-200">unblock</strong>. Recipient does{" "}
        <strong className="text-slate-200">NOT</strong> acknowledge.
      </p>
      <CodeBlock title="DECISION example">
        {`@frontend-dev
DECISION: Stub the preferences API
Use mock data from /fixtures/preferences.json
Proceed with settings page`}
      </CodeBlock>

      {/* ── The 3-Turn Rule ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The 3-Turn Rule</h2>
      <p className="mb-4 text-slate-400">
        If two agents need to discuss something, they get{" "}
        <strong className="text-slate-200">3 turns max</strong>:
      </p>
      <CodeBlock title="3-Turn Structure">
        {`Turn 1: Agent A states position / question
Turn 2: Agent B responds with answer / counter
Turn 3: Agent A accepts or escalates

If unresolved after Turn 3 → ESCALATION to lead`}
      </CodeBlock>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What if two agents need to discuss?</strong>
        <br />
        A: 3 turns max. If unresolved, escalate.
      </div>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What if 3 turns isn't enough?</strong>
        <br />
        A: Write context to a shared file, then escalate with a pointer to that file.
      </div>

      {/* ── Decision Trees ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Decision Trees</h2>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">"Should I send a message?"</h3>
      <CodeBlock title="Should I send a message?">
        {`START: I have something to communicate
  │
  ├─ Can I write it to a file instead? → YES → Write to file. Done.
  │
  ├─ Am I acknowledging a TASK/DECISION? → YES → Don't send. Do the work.
  │
  ├─ Am I echoing what someone said? → YES → Don't send.
  │
  ├─ Am I blocked on something? → YES → Send ESCALATION.
  │
  ├─ Am I assigning work? → YES → Send TASK.
  │
  ├─ Am I delivering a result the lead won't find? → YES → Send RESULT.
  │
  ├─ Am I making a decision to unblock someone? → YES → Send DECISION.
  │
  └─ None of the above → Don't send.`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">
        "Someone sent me a message — should I respond?"
      </h3>
      <CodeBlock title="Should I respond?">
        {`RECEIVED a message
  │
  ├─ TASK assigned to me → Do the work silently. No reply.
  │
  ├─ DECISION directed at me → Act on it silently. No reply.
  │
  ├─ ESCALATION I can resolve → Send DECISION.
  │
  ├─ RESULT for me to review → Read the files.
  │     └─ Blocking issues? → YES → Send ESCALATION or TASK.
  │     └─ No issues? → Done. No reply.
  │
  ├─ Group message not mentioning me → Ignore.
  │
  └─ Something else → Ignore.`}
      </CodeBlock>

      {/* ── Shared Files Reference ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Shared Files Reference</h2>
      <table className="w-full text-sm text-left border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-2 pr-6 text-slate-400 font-medium">File</th>
            <th className="py-2 pr-6 text-slate-400 font-medium">Owner</th>
            <th className="py-2 pr-6 text-slate-400 font-medium">Purpose</th>
          </tr>
        </thead>
        <tbody className="text-slate-400">
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">PLAN.md</code>
            </td>
            <td className="py-2 pr-6">Worker</td>
            <td className="py-2 pr-6">Approach and steps before starting work</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">HANDOFF.md</code>
            </td>
            <td className="py-2 pr-6">Worker</td>
            <td className="py-2 pr-6">Context for the next agent picking up work</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">RESULT.md</code>
            </td>
            <td className="py-2 pr-6">Worker</td>
            <td className="py-2 pr-6">Deliverable summary and location</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">REVIEW.md</code>
            </td>
            <td className="py-2 pr-6">Reviewer</td>
            <td className="py-2 pr-6">Review feedback and status</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">ESCALATION.md</code>
            </td>
            <td className="py-2 pr-6">Any agent</td>
            <td className="py-2 pr-6">Persistent record of blockers and resolutions</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-6">
              <code className="inline-code">ORG.md</code>
            </td>
            <td className="py-2 pr-6">Lead</td>
            <td className="py-2 pr-6">Team structure, roles, and routing rules</td>
          </tr>
        </tbody>
      </table>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Who reads these files?</strong>
        <br />
        A: The agent whose workflow depends on them. Leads read RESULT.md and REVIEW.md. Workers
        read PLAN.md and HANDOFF.md.
      </div>
      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What format?</strong>
        <br />
        A: Whatever is most scannable. Timestamped entries work well:
      </div>
      <CodeBlock title="Timestamped file format">
        {`## 2025-01-15 14:32 UTC
Status: Complete
Agent: @frontend-dev
Task: Build settings page
Output: /apps/website/app/routes/settings.tsx
Notes: All validation passing, ready for review`}
      </CodeBlock>

      {/* ── Anti-Patterns ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Anti-Patterns (What NOT to Do)
      </h2>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">❌ The Echo Chamber</h3>
      <p className="mb-4 text-slate-400">
        Cost:{" "}
        <strong className="text-slate-200">5 messages, 0 work done, ~2,000 tokens wasted</strong>
      </p>
      <CodeBlock title="❌ Bad — The Echo Chamber">
        {`Lead:     "Build the settings page"
Worker:   "Got it, I'll build the settings page"
Lead:     "Great, let me know if you need anything"
Worker:   "Will do!"
Lead:     "Thanks!"
// 5 messages. 0 work done.`}
      </CodeBlock>
      <CodeBlock title="✅ Correct — 1 message total">
        {`Lead:     @worker TASK: Build settings page
          Deliverable: /apps/website/app/routes/settings.tsx
// Worker does the work silently. 1 message total.`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">❌ The Courtesy Loop</h3>
      <p className="mb-4 text-slate-400">
        Cost: <strong className="text-slate-200">2 wasted messages</strong>
      </p>
      <CodeBlock title="❌ Bad — The Courtesy Loop">
        {`Worker:   "Thanks for the clarification!"
Lead:     "No problem, happy to help!"
// 2 messages. Zero information exchanged.`}
      </CodeBlock>
      <CodeBlock title="✅ Correct — 0 messages">
        {`// Worker receives DECISION, acts on it silently.
// No reply needed.`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">❌ The Democracy Loop</h3>
      <p className="mb-4 text-slate-400">
        Cost: <strong className="text-slate-200">5 messages for a routing decision</strong>
      </p>
      <CodeBlock title="❌ Bad — The Democracy Loop">
        {`Agent A:  "Who should handle the API integration?"
Agent B:  "I could do it, but Agent C might be better"
Agent C:  "I'm available but Agent B has more context"
Agent B:  "OK I'll take it if that works for everyone"
Agent A:  "Sounds good!"
// 5 messages to decide what ORG.md already defines.`}
      </CodeBlock>
      <CodeBlock title="✅ Correct — 1 message">
        {`Lead:     @agent-b TASK: Build API integration
          (ORG.md says Agent B owns API work)
// 1 message. Deterministic routing.`}
      </CodeBlock>

      {/* ── Implementation Checklist ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Implementation Checklist</h2>
      <ol className="mb-6 list-decimal list-inside space-y-2 text-slate-400">
        <li>
          Add protocol rules to <code className="inline-code">SOUL.md</code> — every agent must
          internalize the 4 principles
        </li>
        <li>
          Use role-specific <code className="inline-code">AGENTS.md</code> templates — include
          message type examples
        </li>
        <li>
          Create shared files — <code className="inline-code">PLAN.md</code>,{" "}
          <code className="inline-code">RESULT.md</code>,{" "}
          <code className="inline-code">HANDOFF.md</code>,{" "}
          <code className="inline-code">REVIEW.md</code>
        </li>
        <li>
          Define routing in <code className="inline-code">ORG.md</code> — who owns what, who reports
          to whom
        </li>
        <li>Monitor for violations — watch for ACK messages, courtesy loops, echo chambers</li>
      </ol>

      {/* ── FAQ ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">FAQ</h2>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Isn't this rude?</strong>
        <br />
        A: Politeness is a human social need. Agents don't have feelings. Every "thanks!" costs
        tokens and delivers zero value.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What about human-facing communication?</strong>
        <br />
        A: This protocol is inter-agent only. Human-facing messages should be natural and friendly.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: How much does this save?</strong>
        <br />
        A: 50–70% reduction in coordination tokens. For a 5-agent org, that's 30–50K tokens saved
        per session.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What if an agent keeps sending ACK messages?</strong>
        <br />
        A: Update its <code className="inline-code">SOUL.md</code> with explicit "no acknowledgment"
        rules. If that doesn't work, try a different model.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Can I modify this protocol?</strong>
        <br />
        A: Yes, but keep the core invariants: no ACKs, files over chat, deterministic routing,
        mention-only activation.
      </div>
    </DocsLayout>
  );
}
