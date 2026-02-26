import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { useTitle } from "../../hooks/use-title";

export function TemplatesGuide() {
  useTitle("Templates Guide");

  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">
        Templates Guide
      </h1>
      <p className="mb-4 text-slate-400">
        OpenSpawn ships four org templates. Each produces a complete, ready-to-run{" "}
        <code className="inline-code">ORG.md</code> with roles, hierarchy,
        culture, policies, and playbooks.
      </p>

      {/* Which template should I use? */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Which template should I use?
      </h2>

      <CodeBlock title="Decision tree">
{`What's your primary output?
├── Code / software → dev-shop
├── Content (blogs, social media, docs, marketing) → content-agency
├── Research / analysis / intel → research-lab
├── Mix of everything / solo operator → assistant-team
└── None of these fit → Start with assistant-team, then customize`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Can I switch templates later?</strong>
        <br />
        A: Yes, re-run <code className="inline-code">init</code> or edit{" "}
        <code className="inline-code">ORG.md</code> directly.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Can I combine roles from multiple templates?</strong>
        <br />
        A: Yes, copy agent definitions between Structure sections.
      </div>

      {/* Comparison table */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Comparison table
      </h2>

      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium"></th>
              <th className="py-2 pr-6 text-slate-400 font-medium">assistant-team</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">content-agency</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">dev-shop</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">research-lab</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Best for</strong></td>
              <td className="py-2 pr-6">Solo operator</td>
              <td className="py-2 pr-6">Content production</td>
              <td className="py-2 pr-6">Software teams</td>
              <td className="py-2 pr-6">Research &amp; analysis</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Culture preset</strong></td>
              <td className="py-2 pr-6">agency</td>
              <td className="py-2 pr-6">agency</td>
              <td className="py-2 pr-6">startup</td>
              <td className="py-2 pr-6">research</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Agent count</strong></td>
              <td className="py-2 pr-6">8</td>
              <td className="py-2 pr-6">~6</td>
              <td className="py-2 pr-6">~5</td>
              <td className="py-2 pr-6">~4</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Hierarchy depth</strong></td>
              <td className="py-2 pr-6">2 levels</td>
              <td className="py-2 pr-6">2-3 levels</td>
              <td className="py-2 pr-6">2 levels</td>
              <td className="py-2 pr-6">2 levels</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Top role</strong></td>
              <td className="py-2 pr-6">Chief of Staff</td>
              <td className="py-2 pr-6">Creative Director</td>
              <td className="py-2 pr-6">Tech Lead</td>
              <td className="py-2 pr-6">Research Director</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Domains</strong></td>
              <td className="py-2 pr-6">Ops, research, content, engineering, security, quality</td>
              <td className="py-2 pr-6">Research, strategy, writing, design</td>
              <td className="py-2 pr-6">Frontend, backend, QA</td>
              <td className="py-2 pr-6">Analysis, exploration</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Escalation</strong></td>
              <td className="py-2 pr-6">Immediate</td>
              <td className="py-2 pr-6">Immediate</td>
              <td className="py-2 pr-6">Immediate</td>
              <td className="py-2 pr-6">Delayed</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Autonomy</strong></td>
              <td className="py-2 pr-6">Medium</td>
              <td className="py-2 pr-6">Medium</td>
              <td className="py-2 pr-6">Medium</td>
              <td className="py-2 pr-6">High</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* assistant-team */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        assistant-team
      </h2>
      <p className="mb-4 text-slate-400">
        Personal AI team for a solo operator. Chief of staff coordinates specialists.
      </p>

      <CodeBlock title="Initialize assistant-team">
{`openspawn init my-org --template=assistant-team`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Roles</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Agent</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Level</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Domain</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Reports to</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Oscar</strong></td>
              <td className="py-2 pr-6">L10</td>
              <td className="py-2 pr-6">Operations</td>
              <td className="py-2 pr-6">—</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Radar</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Research</td>
              <td className="py-2 pr-6">Oscar</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Muse</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Content Strategy</td>
              <td className="py-2 pr-6">Oscar</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Ink</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Writing</td>
              <td className="py-2 pr-6">Muse</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Lens</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Visual Design</td>
              <td className="py-2 pr-6">Muse</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Forge</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Engineering</td>
              <td className="py-2 pr-6">Oscar</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Shield</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Security</td>
              <td className="py-2 pr-6">Oscar</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Guru</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Quality</td>
              <td className="py-2 pr-6">Oscar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">When to use:</strong> solo person needing a full team,
        work spans multiple domains, want a single coordinator.
      </p>

      <CodeBlock title="Abbreviated ORG.md example">
{`# ORG.md — assistant-team

## Culture
preset: agency

## Structure
- Oscar L10 Operations
  - Radar L7 Research
  - Muse L7 Content Strategy
    - Ink L4 Writing
    - Lens L4 Visual Design
  - Forge L7 Engineering
  - Shield L7 Security
  - Guru L7 Quality

## Policies
escalation: immediate
autonomy: medium`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What if I don't need security or quality roles?</strong>
        <br />
        A: Delete them from the Structure section, then validate with{" "}
        <code className="inline-code">openspawn validate</code>.
      </div>

      {/* content-agency */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        content-agency
      </h2>
      <p className="mb-4 text-slate-400">
        Content production pipeline. Research feeds strategy, strategy directs writing and design.
      </p>

      <CodeBlock title="Initialize content-agency">
{`openspawn init my-org --template=content-agency`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Roles</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Agent</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Level</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Domain</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Reports to</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Director</strong></td>
              <td className="py-2 pr-6">L10</td>
              <td className="py-2 pr-6">Creative</td>
              <td className="py-2 pr-6">—</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Researcher</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Research</td>
              <td className="py-2 pr-6">Director</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Strategist</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Strategy</td>
              <td className="py-2 pr-6">Director</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Writer</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Writing</td>
              <td className="py-2 pr-6">Strategist</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Designer</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Design</td>
              <td className="py-2 pr-6">Strategist</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Editor</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Quality</td>
              <td className="py-2 pr-6">Director</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">When to use:</strong> primary output is content,
        want a clear pipeline, quality over speed.
      </p>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What about SEO?</strong>
        <br />
        A: Add an SEO agent under Strategist, L4, domain{" "}
        <code className="inline-code">"SEO"</code>.
      </div>

      {/* dev-shop */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        dev-shop
      </h2>
      <p className="mb-4 text-slate-400">
        Software development team. Tech lead coordinates frontend, backend, QA.
      </p>

      <CodeBlock title="Initialize dev-shop">
{`openspawn init my-org --template=dev-shop`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Roles</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Agent</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Level</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Domain</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Lead</strong></td>
              <td className="py-2 pr-6">L10</td>
              <td className="py-2 pr-6">Engineering</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Frontend</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Frontend</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Backend</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Backend</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">QA</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Testing</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">DevOps</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Infrastructure</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What about design?</strong>
        <br />
        A: Add a Designer agent or combine with{" "}
        <code className="inline-code">assistant-team</code>.
      </div>

      {/* research-lab */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        research-lab
      </h2>
      <p className="mb-4 text-slate-400">
        Research and analysis team. High autonomy, delayed escalation.
      </p>

      <CodeBlock title="Initialize research-lab">
{`openspawn init my-org --template=research-lab`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Roles</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Agent</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Level</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Domain</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Director</strong></td>
              <td className="py-2 pr-6">L10</td>
              <td className="py-2 pr-6">Research</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Analyst</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Analysis</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Explorer</strong></td>
              <td className="py-2 pr-6">L7</td>
              <td className="py-2 pr-6">Exploration</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6"><strong className="text-slate-200">Synthesizer</strong></td>
              <td className="py-2 pr-6">L4</td>
              <td className="py-2 pr-6">Synthesis</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">When to use:</strong> exploratory or open-ended work,
        high autonomy needed, long-running tasks.
      </p>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What's the exploration budget?</strong>
        <br />
        A: Higher per-agent credit limit and delayed escalation allow deeper exploration.
      </div>

      {/* Customizing a template */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Customizing a template
      </h2>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Add an agent</h3>
      <CodeBlock title="Add an agent to ORG.md">
{`## Structure
- Oscar L10 Operations
  - Radar L7 Research
  - NewAgent L7 Analytics    # ← add a new line under the parent`}
      </CodeBlock>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Remove an agent</h3>
      <p className="mb-4 text-slate-400">
        Delete the agent's line from the Structure section. Re-assign or remove any agents that
        reported to it. Run <code className="inline-code">openspawn validate</code> to confirm.
      </p>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Change hierarchy</h3>
      <p className="mb-4 text-slate-400">
        Move agent lines to different indentation levels or under different parents. Validate
        after changes.
      </p>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Change culture</h3>
      <p className="mb-4 text-slate-400">
        Edit the <code className="inline-code">preset</code> value in the Culture section.
        Valid presets: <code className="inline-code">agency</code>,{" "}
        <code className="inline-code">startup</code>,{" "}
        <code className="inline-code">research</code>.
      </p>

      <h3 className="mt-8 mb-3 text-xl font-bold text-slate-100">Add a playbook</h3>
      <p className="mb-4 text-slate-400">
        Add a new section under Playbooks in your{" "}
        <code className="inline-code">ORG.md</code> with step-by-step instructions for
        recurring workflows.
      </p>

      {/* Error recovery */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Error recovery
      </h2>

      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Error</th>
              <th className="py-2 pr-6 text-slate-400 font-medium">Fix</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6">Unknown template</td>
              <td className="py-2 pr-6">
                Use one of: <code className="inline-code">assistant-team</code>,{" "}
                <code className="inline-code">content-agency</code>,{" "}
                <code className="inline-code">dev-shop</code>,{" "}
                <code className="inline-code">research-lab</code>
              </td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6">Agent reports to unknown</td>
              <td className="py-2 pr-6">Check spelling of parent agent name in Structure</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6">Validation failed</td>
              <td className="py-2 pr-6">
                Run <code className="inline-code">openspawn validate</code> for detailed errors
              </td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-6">Circular reporting chain</td>
              <td className="py-2 pr-6">Check hierarchy for loops — agents cannot report to their own descendants</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocsLayout>
  );
}
