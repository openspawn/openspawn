// ── Audit Command ────────────────────────────────────────────────────────────
// Interactive ORG.md context gap audit. Walks the user through interview-style
// questions to surface unwritten rules, institutional knowledge, and guardrails.
// Generates/updates culture:, policies:, institutional_knowledge:, and guardrails:
// sections in the ORG.md file.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { parseOrgMdContent, generateOrgMd } from "../../core/org-parser.js";
import type { Guardrail } from "../../core/types.js";

interface AuditAnswers {
  unwrittenRules: string;
  deployRules: string;
  sensitiveTopics: string;
  escalationPatterns: string;
  historicalContext: string;
  domainKnowledge: string;
  relationshipContext: string;
  complianceRules: string;
  communicationNorms: string;
  decisionAuthority: string;
  budgetRules: string;
  reviewRequirements: string;
}

const QUESTIONS: { key: keyof AuditAnswers; message: string; placeholder: string }[] = [
  {
    key: "unwrittenRules",
    message: "What unwritten rules does your team follow?",
    placeholder:
      'e.g. "We never deploy on Fridays", "Always CC the PM on client emails"',
  },
  {
    key: "deployRules",
    message: "Are there any deployment restrictions or schedules?",
    placeholder:
      'e.g. "No deploys after 4pm", "Staging must pass before production"',
  },
  {
    key: "sensitiveTopics",
    message: "What topics require special handling or escalation?",
    placeholder:
      'e.g. "Billing changes need CFO approval", "Customer data requires L7+ review"',
  },
  {
    key: "escalationPatterns",
    message: "How should agents escalate issues?",
    placeholder:
      'e.g. "Security issues go directly to CTO", "Budget overruns escalate to COO"',
  },
  {
    key: "historicalContext",
    message: "What historical decisions should agents know about?",
    placeholder:
      'e.g. "We tried microservices in 2024, it failed — we\'re monolith-first now"',
  },
  {
    key: "domainKnowledge",
    message: "What domain-specific knowledge is critical?",
    placeholder:
      'e.g. "Our compliance team must review anything customer-facing"',
  },
  {
    key: "relationshipContext",
    message: "Any important relationship dynamics?",
    placeholder:
      'e.g. "Engineering and Sales have tension around timelines"',
  },
  {
    key: "complianceRules",
    message: "What compliance or regulatory requirements apply?",
    placeholder: 'e.g. "GDPR for EU customers", "SOC2 for data handling"',
  },
  {
    key: "communicationNorms",
    message: "What are the communication norms?",
    placeholder:
      'e.g. "Async-first", "Daily standups at 9am", "No Slack after 6pm"',
  },
  {
    key: "decisionAuthority",
    message: "Who has authority to make what decisions?",
    placeholder:
      'e.g. "Tech decisions: CTO", "Hiring: CEO + dept lead"',
  },
  {
    key: "budgetRules",
    message: "Any budget-related rules or constraints?",
    placeholder:
      'e.g. "Per-agent limit: $50/day", "No new SaaS without CFO approval"',
  },
  {
    key: "reviewRequirements",
    message: "What requires review before proceeding?",
    placeholder:
      'e.g. "All PRs need at least 1 review", "Public docs need marketing approval"',
  },
];

function parseGuardrailsFromAnswers(answers: AuditAnswers): Guardrail[] {
  const guardrails: Guardrail[] = [];

  // Parse deploy rules into guardrails
  if (answers.deployRules.trim()) {
    const text = answers.deployRules.toLowerCase();
    if (text.includes("friday")) {
      guardrails.push({
        name: "no-friday-deploys",
        trigger: "task.transition",
        condition: "day_of_week != friday",
        action: "block",
        message: "Deploys are not allowed on Fridays.",
      });
    }
    if (text.includes("after") && /\d+\s*(pm|am)/.test(text)) {
      guardrails.push({
        name: "deploy-time-restriction",
        trigger: "task.transition",
        condition: "always",
        action: "warn",
        message: answers.deployRules.trim(),
      });
    }
  }

  // Parse sensitive topics into escalation guardrails
  if (answers.sensitiveTopics.trim()) {
    const topics = answers.sensitiveTopics
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    for (const topic of topics) {
      const nameSlug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30);
      guardrails.push({
        name: `escalate-${nameSlug}`,
        trigger: "task.created",
        match: topic.split(/\s+/).slice(0, 3).join("|"),
        action: "escalate",
        message: topic,
      });
    }
  }

  return guardrails;
}

function generateEnrichedSections(answers: AuditAnswers): string {
  const lines: string[] = [];

  // Culture section
  const cultureItems = [
    answers.communicationNorms,
    answers.relationshipContext,
  ].filter((s) => s.trim());
  if (cultureItems.length > 0) {
    lines.push("## Culture", "");
    for (const item of cultureItems) {
      lines.push(`- ${item.trim()}`);
    }
    lines.push("");
  }

  // Policies section
  const policyItems = [
    answers.budgetRules,
    answers.reviewRequirements,
    answers.complianceRules,
  ].filter((s) => s.trim());
  if (policyItems.length > 0) {
    lines.push("## Policies", "");
    for (const item of policyItems) {
      lines.push(`- ${item.trim()}`);
    }
    lines.push("");
  }

  // Institutional Knowledge section
  const knowledgeItems = [
    answers.historicalContext,
    answers.domainKnowledge,
    answers.unwrittenRules,
    answers.decisionAuthority,
    answers.escalationPatterns,
  ].filter((s) => s.trim());
  if (knowledgeItems.length > 0) {
    lines.push("## Institutional Knowledge", "");
    for (const item of knowledgeItems) {
      lines.push(`- ${item.trim()}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function auditCommand(
  args: string[],
  ctx: { dir: string; orgFile?: string },
): Promise<void> {
  const orgPath = ctx.orgFile ?? join(ctx.dir, "ORG.md");
  const isUpdate = existsSync(orgPath);

  p.intro("🔍 OpenSpawn Context Gap Audit");

  if (isUpdate) {
    p.note(`Found existing ORG.md at ${orgPath}\nAnswers will be merged into existing content.`);
  } else {
    p.note("No ORG.md found. A new one will be created from your answers.");
  }

  const answers: Partial<AuditAnswers> = {};

  for (const q of QUESTIONS) {
    if (p.isCancel(answers)) {
      p.cancel("Audit cancelled.");
      process.exit(0);
    }
    const result = await p.text({
      message: q.message,
      placeholder: q.placeholder,
      defaultValue: "",
    });
    if (p.isCancel(result)) {
      p.cancel("Audit cancelled.");
      process.exit(0);
    }
    answers[q.key] = result as string;
  }

  const fullAnswers = answers as AuditAnswers;
  const guardrails = parseGuardrailsFromAnswers(fullAnswers);
  const enrichedSections = generateEnrichedSections(fullAnswers);

  if (isUpdate) {
    // Merge into existing ORG.md
    const existingContent = readFileSync(orgPath, "utf-8");
    const org = parseOrgMdContent(existingContent);

    // Merge guardrails
    const existingGuardrails = org.guardrails ?? [];
    const existingNames = new Set(existingGuardrails.map((g) => g.name));
    const newGuardrails = guardrails.filter((g) => !existingNames.has(g.name));
    org.guardrails = [...existingGuardrails, ...newGuardrails];

    // Regenerate the structured part + append enriched sections
    let output = generateOrgMd(org);

    // Append enriched sections that aren't already in the file
    if (enrichedSections.trim()) {
      // Only add sections that don't already exist
      const existingLower = existingContent.toLowerCase();
      const lines = enrichedSections.split("\n");
      const filteredLines: string[] = [];
      let skipSection = false;
      for (const line of lines) {
        if (line.startsWith("## ")) {
          const sectionName = line.slice(3).trim().toLowerCase();
          skipSection = existingLower.includes(`## ${sectionName}`);
          if (!skipSection) filteredLines.push(line);
        } else if (!skipSection) {
          filteredLines.push(line);
        }
      }
      const newContent = filteredLines.join("\n").trim();
      if (newContent) {
        output = output.trimEnd() + "\n\n" + newContent + "\n";
      }
    }

    writeFileSync(orgPath, output);
    p.note(`Updated ${orgPath}`);
  } else {
    // Create new ORG.md
    const orgName = await p.text({
      message: "What's your organization name?",
      placeholder: "Acme Corp",
      defaultValue: "My Organization",
    });
    if (p.isCancel(orgName)) {
      p.cancel("Audit cancelled.");
      process.exit(0);
    }

    let content = `# ${orgName}\n\n`;
    content += enrichedSections;

    // Add guardrails section
    if (guardrails.length > 0) {
      content += "## Guardrails\n\n";
      for (const g of guardrails) {
        content += `### ${g.name}\n\n`;
        content += `- **Trigger:** ${g.trigger}\n`;
        if (g.condition) content += `- **Condition:** ${g.condition}\n`;
        if (g.match) content += `- **Match:** ${g.match}\n`;
        content += `- **Action:** ${g.action}\n`;
        if (g.escalate_to) content += `- **Escalate To:** ${g.escalate_to}\n`;
        content += `- **Message:** ${g.message}\n`;
        content += "\n";
      }
    }

    content += "## Structure\n\n_Add your agent hierarchy here._\n";

    writeFileSync(orgPath, content);
    p.note(`Created ${orgPath}`);
  }

  const s = p.spinner();
  s.start("Validating generated ORG.md...");
  try {
    const content = readFileSync(orgPath, "utf-8");
    const parsed = parseOrgMdContent(content);
    s.stop(
      `✅ Valid ORG.md: ${parsed.agents.length} agents, ${(parsed.guardrails ?? []).length} guardrails`,
    );
  } catch {
    s.stop("⚠️  ORG.md generated but has parse warnings");
  }

  p.outro("Audit complete! Review your ORG.md and refine as needed.");
}
