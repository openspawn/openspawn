import { useState, useMemo, useCallback } from "react";
import { useTitle } from "../hooks/use-title";
import { parseOrgMdBrowser, type OrgPreview } from "../utils/org-parser-browser";
import { Badge } from "../components/badge";

// ── Template definitions ──────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  agentCount: number;
  badgeColor: "cyan" | "violet" | "amber" | "emerald" | "slate";
  badgeLabel: string;
  orgMd: string;
}

const TEMPLATES: Template[] = [
  {
    id: "saas-onboarding",
    name: "SaaS Customer Onboarding",
    description:
      "Manual onboarding takes 2–3 days per customer across 4 teams. This agent org handles data migration, config, integration testing, and success check-in — end to end.",
    emoji: "🚀",
    agentCount: 4,
    badgeColor: "cyan",
    badgeLabel: "SAAS",
    orgMd: `# customer-onboarding
> Mission: Onboard new enterprise customers end-to-end

## Identity
- **Industry:** SaaS
- **Pain:** Manual onboarding takes 2-3 days per customer, 4 teams

## Culture
- **Preset:** professional
- **Escalation:** 30 min — customers can't wait
- **Progress updates:** on every milestone
- **Ack required:** yes

## Policies
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
- **Period:** daily

## Structure

### Onboarding Lead
Owns the full customer journey from contract-signed to go-live.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** operations

#### Data Migration Specialist
Moves and validates customer data from legacy systems safely.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** data

#### Integration Engineer
Configures API connectors, runs integration tests, documents endpoints.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** engineering

#### Success Agent
Schedules check-ins, collects health scores, flags churn risk early.
- **Level:** 4
- **Model:** ollama/qwen2.5
- **Domain:** success
`,
  },
  {
    id: "incident-response",
    name: "DevOps Incident Response",
    description:
      "3am pages, 45-min MTTR, context-switching between 6 tools. This agent org detects, diagnoses, drafts the fix, coordinates rollback, and handles comms — autonomously.",
    emoji: "🚨",
    agentCount: 4,
    badgeColor: "violet",
    badgeLabel: "DEVOPS",
    orgMd: `# incident-response
> Mission: Detect, diagnose, and remediate production incidents

## Identity
- **Industry:** DevOps / Platform Engineering
- **Pain:** 3am pages, 45-min MTTR, context-switching between 6 tools

## Culture
- **Preset:** ops
- **Escalation:** immediate — production is down
- **Progress updates:** every 5 minutes during active incident
- **Ack required:** yes

## Policies
- **Per-agent limit:** 1000 credits/incident
- **Alert threshold:** 90%
- **Overage:** pause and escalate to human

## Structure

### Incident Commander
Coordinates all agents, owns runbook execution, drives MTTR down.
- **Level:** 8
- **Model:** claude-opus
- **Domain:** incident management

#### Diagnostics Agent
Reads logs, traces, metrics. Identifies root cause and blast radius.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** observability

#### Remediation Agent
Drafts and applies fixes: rollbacks, config changes, service restarts.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** infrastructure

#### Comms Agent
Drafts status page updates, Slack messages, and post-mortems.
- **Level:** 4
- **Model:** claude-haiku
- **Domain:** communications
`,
  },
  {
    id: "contract-review",
    name: "Legal Contract Review",
    description:
      "Junior associates spend 80+ hrs/week on manual contract review. This agent org extracts clauses, compares against playbook, flags risks, and drafts the summary memo.",
    emoji: "⚖️",
    agentCount: 4,
    badgeColor: "amber",
    badgeLabel: "LEGAL",
    orgMd: `# contract-review
> Mission: Review and analyze contracts against company playbook

## Identity
- **Industry:** Legal / Corporate
- **Pain:** Junior associates spend 80+ hrs/week on manual review

## Culture
- **Preset:** professional
- **Escalation:** flag ambiguous clauses to Senior Reviewer immediately
- **Progress updates:** on each clause batch completion
- **Ack required:** yes

## Policies
- **Per-agent limit:** 800 credits/contract
- **Alert threshold:** 85%
- **Period:** per-job

## Structure

### Senior Reviewer
Owns the final risk assessment. Signs off on all flagged clauses.
- **Level:** 7
- **Model:** claude-opus
- **Domain:** legal review

#### Clause Extractor
Parses contract text, identifies and tags all material clauses by type.
- **Level:** 5
- **Model:** claude-sonnet
- **Domain:** document processing

#### Risk Analyst
Compares extracted clauses against company playbook. Scores risk.
- **Level:** 5
- **Model:** claude-sonnet
- **Domain:** risk analysis

#### Summary Writer
Drafts the review memo with key findings, red flags, and recommendations.
- **Level:** 4
- **Model:** claude-haiku
- **Domain:** writing
`,
  },
  {
    id: "compliance-monitoring",
    name: "Fintech Compliance",
    description:
      "Manual transaction monitoring misses 15% of anomalies. This agent org scans transactions, applies rules, generates SAR-ready reports, and escalates automatically.",
    emoji: "🏦",
    agentCount: 4,
    badgeColor: "emerald",
    badgeLabel: "FINTECH",
    orgMd: `# compliance-monitoring
> Mission: Monitor transactions and generate compliance reports

## Identity
- **Industry:** Fintech / Banking
- **Pain:** Manual monitoring misses 15% of anomalies; reports take days

## Culture
- **Preset:** compliance
- **Escalation:** immediate on high-risk flags — regulatory exposure
- **Progress updates:** every batch completion + daily summary
- **Ack required:** yes

## Policies
- **Per-agent limit:** 600 credits/day
- **Alert threshold:** 80%
- **Period:** daily

## Structure

### Compliance Lead
Owns regulatory posture. Reviews high-risk flags, approves SAR filings.
- **Level:** 7
- **Model:** claude-opus
- **Domain:** compliance

#### Transaction Analyst
Ingests transaction feeds, applies anomaly detection, scores risk.
- **Level:** 5
- **Model:** claude-sonnet
- **Domain:** transaction analysis

#### Rule Engine Agent
Applies AML/KYC rules, jurisdiction-specific thresholds, and watchlists.
- **Level:** 5
- **Model:** claude-sonnet
- **Domain:** rule processing

#### Report Generator
Drafts compliance reports, SAR narratives, and audit-ready summaries.
- **Level:** 4
- **Model:** claude-haiku
- **Domain:** reporting
`,
  },
  {
    id: "game-live-ops",
    name: "Gaming Live Ops",
    description:
      "Player churn from stale content and unbalanced economy. This agent org monitors metrics, tunes the economy, generates seasonal content, and handles support escalations.",
    emoji: "🎮",
    agentCount: 4,
    badgeColor: "violet",
    badgeLabel: "GAMING",
    orgMd: `# game-live-ops
> Mission: Maintain healthy game economy and player engagement

## Identity
- **Industry:** Gaming / Live Service
- **Pain:** Player churn from stale content and unbalanced economy

## Culture
- **Preset:** creative-ops
- **Escalation:** 1 hour for economy anomalies — snowball risk
- **Progress updates:** daily metrics digest + on content release
- **Ack required:** no

## Policies
- **Per-agent limit:** 400 credits/day
- **Alert threshold:** 75%
- **Period:** daily

## Structure

### Ops Director
Owns game health KPIs. Coordinates content and economy agents.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** live operations

#### Economy Tuner
Analyzes sink/source ratios, adjusts drop rates, models inflation curves.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** game economy

#### Content Generator
Writes event descriptions, NPC dialogue, seasonal challenges, patch notes.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** content creation

#### Player Support
Triages support tickets, issues compensation, escalates exploits.
- **Level:** 4
- **Model:** ollama/qwen2.5
- **Domain:** player support
`,
  },
  {
    id: "catalog-management",
    name: "E-commerce Catalog",
    description:
      "10,000 SKUs, competitors change prices daily, descriptions go stale. This agent org monitors competitors, optimizes pricing, rewrites descriptions, and flags anomalies.",
    emoji: "🛒",
    agentCount: 4,
    badgeColor: "amber",
    badgeLabel: "E-COMMERCE",
    orgMd: `# catalog-management
> Mission: Keep product catalog competitive and optimized

## Identity
- **Industry:** E-commerce / Retail
- **Pain:** 10k SKUs, daily competitor price changes, stale descriptions

## Culture
- **Preset:** ops
- **Escalation:** 2 hours for price anomalies — margin impact
- **Progress updates:** daily pricing digest + on content batch
- **Ack required:** yes for price changes >15%

## Policies
- **Per-agent limit:** 300 credits/day
- **Alert threshold:** 80%
- **Period:** daily

## Structure

### Catalog Manager
Owns catalog quality and pricing strategy. Reviews agent recommendations.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** catalog management

#### Price Optimizer
Monitors competitor prices, applies margin rules, recommends adjustments.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** pricing

#### Content Writer
Rewrites product descriptions, generates SEO copy, updates attributes.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** content

#### Competitor Monitor
Tracks competitor SKUs, prices, availability. Feeds data to Price Optimizer.
- **Level:** 4
- **Model:** ollama/qwen2.5
- **Domain:** competitive intelligence
`,
  },
  {
    id: "clinical-trial-processing",
    name: "Healthcare Clinical Trials",
    description:
      "Regulatory submissions take months of manual data processing. This agent org parses study data, validates protocols, drafts regulatory sections, and tracks submission status.",
    emoji: "🏥",
    agentCount: 4,
    badgeColor: "slate",
    badgeLabel: "HEALTHCARE",
    orgMd: `# clinical-trial-processing
> Mission: Process clinical trial data and prepare regulatory submissions

## Identity
- **Industry:** Healthcare / Pharma
- **Pain:** Regulatory submissions take months of manual data processing

## Culture
- **Preset:** compliance
- **Escalation:** immediate on data integrity issues — patient safety
- **Progress updates:** on each study milestone
- **Ack required:** yes — all outputs require Study Director sign-off

## Policies
- **Per-agent limit:** 1000 credits/study
- **Alert threshold:** 85%
- **Period:** per-study

## Structure

### Study Director
Owns submission integrity and regulatory strategy. Final sign-off authority.
- **Level:** 8
- **Model:** claude-opus
- **Domain:** clinical research

#### Data Analyst
Parses raw study data, runs statistical validations, generates tables/figures.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** biostatistics

#### Protocol Validator
Cross-checks data against approved protocol. Flags deviations.
- **Level:** 5
- **Model:** claude-sonnet
- **Domain:** protocol compliance

#### Regulatory Writer
Drafts CSR sections, prepares eCTD modules, formats for FDA/EMA submission.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** regulatory writing
`,
  },
];

// ── OrgPreview display component ─────────────────────────────────────────────

function OrgPreviewPanel({ preview }: { preview: OrgPreview }) {
  if (preview.errors.length > 0 && preview.agentCount === 0) {
    return (
      <div className="flex flex-col gap-2">
        {preview.errors.map((e, i) => (
          <p key={i} className="text-sm text-amber-400/80 font-mono">
            ⚠ {e}
          </p>
        ))}
      </div>
    );
  }

  const levelBadge = (level: number) => {
    if (level >= 10)
      return { label: "CEO", color: "text-amber-400 bg-amber-400/10 ring-amber-400/20" };
    if (level >= 9)
      return { label: "Director", color: "text-violet-400 bg-violet-400/10 ring-violet-400/20" };
    if (level >= 7)
      return { label: "Lead", color: "text-cyan-400 bg-cyan-400/10 ring-cyan-400/20" };
    if (level >= 6)
      return { label: "Senior", color: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20" };
    if (level <= 2)
      return { label: "Intern", color: "text-slate-400 bg-slate-400/10 ring-slate-400/20" };
    return { label: "Agent", color: "text-slate-300 bg-slate-300/10 ring-slate-300/20" };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100 leading-tight">{preview.name}</h3>
          {preview.description && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
              {preview.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-2xl font-bold text-cyan-400">{preview.agentCount}</span>
          <span className="text-xs text-slate-500">agents</span>
        </div>
      </div>

      {/* Culture chips */}
      {(preview.culture.preset || preview.culture.escalation) && (
        <div className="flex flex-wrap gap-2">
          {preview.culture.preset && (
            <span className="rounded-full px-2 py-0.5 text-xs font-mono ring-1 ring-inset text-violet-400 bg-violet-400/10 ring-violet-400/20">
              preset: {preview.culture.preset}
            </span>
          )}
          {preview.culture.escalation && (
            <span className="rounded-full px-2 py-0.5 text-xs font-mono ring-1 ring-inset text-amber-400 bg-amber-400/10 ring-amber-400/20">
              escalate: {preview.culture.escalation}
            </span>
          )}
        </div>
      )}

      {/* Departments */}
      <div className="space-y-3">
        {preview.departments.map((dept) => (
          <div key={dept.name} className="rounded-lg border border-white/5 bg-white/[0.015] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {dept.name}
            </p>
            <div className="space-y-1.5">
              {dept.agents.map((agent) => {
                const badge = levelBadge(agent.level);
                const isLead = agent.level >= 7;
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-2 ${isLead ? "" : "pl-4 border-l border-white/5"}`}
                  >
                    <span className="text-base leading-none">
                      {agent.level >= 10 ? "👑" : agent.level >= 7 ? "🎯" : "🤖"}
                    </span>
                    <span
                      className={`text-sm font-medium ${isLead ? "text-slate-200" : "text-slate-400"}`}
                    >
                      {agent.name}
                    </span>
                    {agent.role && (
                      <span className="text-xs text-slate-600 truncate">{agent.role}</span>
                    )}
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {preview.errors.length > 0 && (
        <div className="space-y-1">
          {preview.errors.map((e, i) => (
            <p key={i} className="text-xs text-amber-400/70">
              ⚠ {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: Template }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(template.orgMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = useMemo(() => parseOrgMdBrowser(template.orgMd), [template.orgMd]);

  // Show just the first 8 lines as a teaser
  const teaserLines = template.orgMd.split("\n").slice(0, 8).join("\n");

  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition hover:border-white/10">
      {/* Card header — always visible */}
      <button
        type="button"
        className="w-full cursor-pointer text-left p-6"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{template.emoji}</span>
              <Badge color={template.badgeColor} size="sm" uppercase>
                {template.badgeLabel}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">{template.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{template.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-3xl font-bold text-slate-100">{template.agentCount}</span>
            <span className="text-xs text-slate-500">agents</span>
          </div>
        </div>

        {/* Teaser code snippet */}
        <div className="mt-4 rounded-lg bg-black/30 border border-white/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.01]">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-slate-600 font-mono">ORG.md</span>
          </div>
          <pre className="p-3 text-xs font-mono text-slate-400 leading-relaxed overflow-hidden whitespace-pre-wrap line-clamp-5">
            {teaserLines}
          </pre>
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-cyan-400 transition">
          {expanded ? (
            <>
              <span>Collapse</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          ) : (
            <>
              <span>View full ORG.md</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </div>
      </button>

      {/* Expanded: full ORG.md + parsed preview */}
      {expanded && (
        <div className="border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Full source */}
          <div className="relative p-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.01]">
              <span className="text-xs font-mono text-slate-500">ORG.md — full source</span>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-white/5 text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-96 overflow-y-auto bg-black/20 whitespace-pre-wrap">
              {template.orgMd}
            </pre>
          </div>

          {/* Parsed preview */}
          <div className="p-4 bg-white/[0.01]">
            <p className="mb-3 text-xs font-mono text-slate-500">parsed org structure</p>
            <OrgPreviewPanel preview={preview} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interactive Playground ────────────────────────────────────────────────────

const PLAYGROUND_DEFAULT = TEMPLATES[0].orgMd;

function InteractivePlayground() {
  const [input, setInput] = useState(PLAYGROUND_DEFAULT);
  const [activeTemplate, setActiveTemplate] = useState<string>("startup");

  const preview = useMemo(() => parseOrgMdBrowser(input), [input]);

  const loadTemplate = useCallback((t: Template) => {
    setInput(t.orgMd);
    setActiveTemplate(t.id);
  }, []);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="text-sm font-semibold text-slate-200">Live ORG.md Playground</span>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/20">
            interactive
          </span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">
          Edit the markdown → see your org update live
        </span>
      </div>

      {/* Quick-load template pills */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 overflow-x-auto">
        <span className="text-xs text-slate-500 shrink-0">Load template:</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => loadTemplate(t)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ring-1 ring-inset ${
              activeTemplate === t.id
                ? "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30"
                : "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Editor + Preview panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[480px] divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="px-4 py-2 border-b border-white/5 bg-black/10">
            <span className="text-xs font-mono text-slate-500">
              ✏️ editor — paste or type your ORG.md
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveTemplate("");
            }}
            spellCheck={false}
            className="flex-1 resize-none bg-transparent p-4 font-mono text-xs text-slate-300 leading-relaxed outline-none placeholder:text-slate-600 focus:bg-white/[0.01]"
            placeholder={`# My Org\n\n## Structure\n\n### CEO — Your Name\n- **Level:** 10\n\n#### Engineer\n- **Level:** 5`}
          />
        </div>

        {/* Live preview */}
        <div className="flex flex-col">
          <div className="px-4 py-2 border-b border-white/5 bg-black/10">
            <span className="text-xs font-mono text-slate-500">
              🔍 live preview — parsed org structure
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {input.trim() ? (
              <OrgPreviewPanel preview={preview} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Start typing your ORG.md
                  <br />
                  to see the live preview →
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-white/5 bg-black/10 text-xs text-slate-600">
        💡 Tip: Use <code className="font-mono text-slate-500">## Structure</code> with{" "}
        <code className="font-mono text-slate-500">### Department</code> and{" "}
        <code className="font-mono text-slate-500">#### Agent — Role</code> headers. Add{" "}
        <code className="font-mono text-slate-500">- **Count:** 3</code> to spawn multiple identical
        agents.
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TemplatesPage() {
  useTitle("Templates — ORG.md Starter Kits");

  return (
    <div className="px-5 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-cyan-500/5 blur-[140px]" />
          <div className="absolute right-1/4 top-32 h-[300px] w-[400px] rounded-full bg-violet-500/4 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 font-mono text-sm tracking-widest text-cyan-400/70 uppercase">
            ORG.md template gallery
          </p>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-text">Starter Orgs</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400 leading-relaxed md:text-xl">
            Seven industry-ready ORG.md templates. SaaS onboarding, incident response, legal review,
            compliance, live ops, e-commerce, and clinical trials — pick one and have agents running
            in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#playground"
              className="rounded-lg bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
            >
              Try playground ↓
            </a>
            <a
              href="/docs/tutorials/your-first-org-md"
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-400 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-slate-200"
            >
              ORG.md guide →
            </a>
          </div>
        </div>
      </section>

      {/* Template gallery */}
      <section className="py-8 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-100">Template Gallery</h2>
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-sm text-slate-500">{TEMPLATES.length} industry templates</span>
          </div>

          <div className="space-y-4">
            {TEMPLATES.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive playground */}
      <section id="playground" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="mb-3 font-mono text-sm tracking-widest text-cyan-400/70 uppercase">
              interactive preview
            </p>
            <h2 className="mb-4 text-3xl font-bold text-slate-100 md:text-4xl">
              See your org <span className="gradient-text">come to life</span>
            </h2>
            <p className="mx-auto max-w-lg text-slate-400 leading-relaxed">
              Paste any ORG.md and watch the parsed structure appear instantly. This is exactly what
              OpenSpawn reads when you run{" "}
              <code className="font-mono text-cyan-400">openspawn start</code>.
            </p>
          </div>

          <InteractivePlayground />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
            <div className="mb-4 text-4xl">🪸</div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100 md:text-3xl">
              Ready to spawn your org?
            </h2>
            <p className="mb-8 text-slate-400 leading-relaxed">
              Pick a template, customize it, drop it in your project root as{" "}
              <code className="font-mono text-cyan-400">ORG.md</code>, and run{" "}
              <code className="font-mono text-cyan-400">openspawn start</code>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/docs/getting-started"
                className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400"
              >
                Get Started →
              </a>
              <a
                href="/docs/tutorials/your-first-org-md"
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/5"
              >
                ORG.md Tutorial →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
