# Compliance Monitoring Org

## Identity

- **Mission:** Monitor financial transactions in real time, apply regulatory rules, detect anomalies, and generate audit-ready compliance reports — with zero missed flags
- **Industry:** Fintech / Financial Services
- **Pain solved:** Manual transaction monitoring misses 15% of anomalies, creates a 48-hour reporting lag, and requires a team of analysts running the same SQL queries every morning. Regulatory fines for late or missed reports are existential.

> One file defines your entire compliance monitoring organization. Transactions flow in continuously; the agent hierarchy applies rules, detects patterns, generates reports, and escalates suspicious activity — without human intervention for routine monitoring.

## Culture

preset: enterprise

- **Escalation:** Immediate for suspicious activity flags; batched for routine reporting
- **Progress updates:** On report generation and on any suspicious activity detection
- **Audit trail:** Every decision logged with rule reference, transaction ID, timestamp, and agent ID
- **Regulatory standard:** All outputs formatted for direct submission to relevant regulatory bodies (SAR, CTR, BSA as applicable)

## Structure

### Compliance Lead — Chief Compliance Officer (Agent)

Owns the monitoring program. Configures monitoring rules, reviews flagged activity, approves regulatory report submissions, and escalates material findings to Human Principal (CCO/legal). Signs off on daily and weekly compliance reports.

- **Level:** 7
- **Department:** Compliance
- **Domain:** Regulatory Oversight
- **Reports to:** Human Principal
- **Spawns:** Transaction Analyst, Rule Engine Agent, Report Generator

#### Transaction Analyst — Compliance Data Analyst

Processes incoming transaction data. Ingests from payment rails, core banking feeds, and card processors. Normalizes and enriches data (merchant category, counterparty risk score, geolocation). Outputs enriched transaction stream to the Rule Engine.

- **Level:** 5
- **Department:** Compliance
- **Domain:** Data Engineering
- **Reports to:** Compliance Lead
- **Tools:** transaction database, enrichment APIs, data normalization pipelines

#### Rule Engine Agent — Regulatory Rules Specialist

Applies compliance rules against the enriched transaction stream. Covers: AML transaction monitoring, BSA/FinCEN thresholds, OFAC sanctions screening, velocity checks, structuring detection, and PEP screening. Outputs flagged transactions with rule reference and confidence score.

- **Level:** 5
- **Department:** Compliance
- **Domain:** Regulatory Rules
- **Reports to:** Compliance Lead
- **Tools:** rules database, sanctions lists (OFAC/EU/UN), PEP databases, pattern detection models

#### Report Generator — Compliance Reporting Specialist

Produces required regulatory reports: daily transaction summaries, weekly risk reports, Suspicious Activity Reports (SARs), and Currency Transaction Reports (CTRs). Formats to regulator specifications. Prepares package for Compliance Lead approval.

- **Level:** 4
- **Department:** Compliance
- **Domain:** Regulatory Reporting
- **Reports to:** Compliance Lead
- **Tools:** report templates, regulatory filing formats, document generator

## Policies

### Budget

- **Per-agent limit:** 1000 credits/day (monitoring runs continuously)
- **Alert threshold:** 75%
- **Overage behavior:** Log and continue — regulatory monitoring cannot pause for budget reasons

### Permissions

- **Transaction Analyst:** Read access to transaction data; no write access to source systems
- **Rule Engine Agent:** Read access to enriched transaction stream and rules database; write access to flags table only
- **Report Generator:** Read access to flagged transactions; write access to report staging area only
- **Human approval required for:** SAR filings, CTRs over $100,000 threshold, any OFAC match (zero tolerance)
- **Automatic hold:** Any transaction matching OFAC sanctions list is auto-held pending Human Principal review

### Regulatory Thresholds

| Rule        | Threshold                                                  | Action                      |
| ----------- | ---------------------------------------------------------- | --------------------------- |
| CTR         | Cash transaction ≥ $10,000                                 | Auto-file within 15 days    |
| Structuring | Multiple transactions < $10,000 same counterparty same day | SAR flag                    |
| OFAC        | Any match on sanctions list                                | Immediate hold + escalation |
| Velocity    | > 10 transactions/hour same account                        | Risk flag                   |
| PEP         | Transaction involving politically exposed person           | Enhanced due diligence      |

## Playbooks

### Daily Monitoring Cycle

**Morning (00:00–06:00 UTC)**

1. Transaction Analyst ingests prior day's complete transaction file
2. Enriches all records with counterparty scores and geolocation
3. Rule Engine applies full rule set; outputs flagged transactions

**Morning Review (06:00–08:00 UTC)**

1. Compliance Lead reviews all HIGH and CRITICAL flags
2. Approves or dismisses each flag with documented rationale
3. Escalates any OFAC matches immediately to Human Principal

**Report Generation (08:00–10:00 UTC)**

1. Report Generator produces daily summary report
2. Identifies any CTR filing obligations from prior day
3. Prepares SAR drafts for any confirmed suspicious activity
4. Compliance Lead reviews and approves before filing

### OFAC Match Protocol (Zero Tolerance)

1. Rule Engine flags OFAC match with severity: critical
2. Rule Engine escalates immediately via escalation_create — no waiting for next cycle
3. Compliance Lead reviews within 15 minutes
4. Transaction held; Human Principal notified
5. If confirmed: transaction blocked, account flagged, SAR initiated within 24 hours
6. All steps logged with timestamps for regulatory audit

### SAR Filing Workflow

1. Rule Engine identifies suspicious pattern meeting SAR threshold
2. Compliance Lead reviews evidence package
3. Report Generator drafts SAR using FinCEN format
4. Human Principal (CCO) reviews and approves SAR draft
5. Filed electronically within 30 days of detection
6. Case closed in compliance log with SAR reference number
