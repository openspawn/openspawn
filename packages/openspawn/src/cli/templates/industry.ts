import { CulturePreset } from "../../core/types.js";
import type { Template } from "./types.js";

function saasOnboarding(): Template {
  return {
    name: "saas-onboarding",
    label: "SaaS Onboarding",
    description:
      "Manual onboarding takes 2-3 days per customer across 4 teams. This agent org handles data migration, config, integration testing, and success check-in.",
    emoji: "\uD83D\uDE80",
    category: "industry",
    culturePreset: CulturePreset.Professional,
    content: `# {{TEAM_NAME}}
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
  };
}

function incidentResponse(): Template {
  return {
    name: "incident-response",
    label: "Incident Response",
    description:
      "3am pages, 45-min MTTR, context-switching between 6 tools. This agent org detects, diagnoses, drafts the fix, coordinates rollback, and handles comms.",
    emoji: "\uD83D\uDEA8",
    category: "industry",
    culturePreset: CulturePreset.Ops,
    content: `# {{TEAM_NAME}}
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
  };
}

function contractReview(): Template {
  return {
    name: "contract-review",
    label: "Contract Review",
    description:
      "Junior associates spend 80+ hrs/week on manual contract review. This agent org extracts clauses, compares against playbook, flags risks, and drafts the summary memo.",
    emoji: "\u2696\uFE0F",
    category: "industry",
    culturePreset: CulturePreset.Professional,
    content: `# {{TEAM_NAME}}
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
  };
}

function complianceMonitoring(): Template {
  return {
    name: "compliance-monitoring",
    label: "Compliance Monitoring",
    description:
      "Manual transaction monitoring misses 15% of anomalies. This agent org scans transactions, applies rules, generates SAR-ready reports, and escalates automatically.",
    emoji: "\uD83C\uDFE6",
    category: "industry",
    culturePreset: CulturePreset.Compliance,
    content: `# {{TEAM_NAME}}
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
  };
}

function gameLiveOps(): Template {
  return {
    name: "game-live-ops",
    label: "Game Live Ops",
    description:
      "Player churn from stale content and unbalanced economy. This agent org monitors metrics, tunes the economy, generates seasonal content, and handles support escalations.",
    emoji: "\uD83C\uDFAE",
    category: "industry",
    culturePreset: CulturePreset.Ops,
    content: `# {{TEAM_NAME}}
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
  };
}

function catalogManagement(): Template {
  return {
    name: "catalog-management",
    label: "Catalog Management",
    description:
      "10,000 SKUs, competitors change prices daily, descriptions go stale. This agent org monitors competitors, optimizes pricing, rewrites descriptions, and flags anomalies.",
    emoji: "\uD83D\uDED2",
    category: "industry",
    culturePreset: CulturePreset.Ops,
    content: `# {{TEAM_NAME}}
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
  };
}

function clinicalTrialProcessing(): Template {
  return {
    name: "clinical-trial-processing",
    label: "Clinical Trial Processing",
    description:
      "Regulatory submissions take months of manual data processing. This agent org parses study data, validates protocols, drafts regulatory sections, and tracks submission status.",
    emoji: "\uD83C\uDFE5",
    category: "industry",
    culturePreset: CulturePreset.Compliance,
    content: `# {{TEAM_NAME}}
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
  };
}

export function industryTemplates(): Template[] {
  return [
    saasOnboarding(),
    incidentResponse(),
    contractReview(),
    complianceMonitoring(),
    gameLiveOps(),
    catalogManagement(),
    clinicalTrialProcessing(),
  ];
}
