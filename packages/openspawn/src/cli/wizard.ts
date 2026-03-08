// ── Interactive Wizard for `openspawn init` ──────────────────────────────────

import {
  intro,
  outro,
  select,
  text,
  multiselect,
  confirm,
  isCancel,
  cancel,
  log,
  note,
} from "@clack/prompts";
import { listTemplates, getTemplate } from "./templates/index.js";
import { VALUE_DEFINITIONS, getConflicts, formatValueWarning } from "./alignment.js";
import {
  CulturePreset,
  LlmProvider,
  OrgValue,
  OverageBehavior,
  EscalationBehavior,
} from "../core/types.js";
import { defaultConfig } from "../core/config.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WizardAnswers {
  templateName: string;
  orgName: string;
  mission: string;
  vision: string;
  values: OrgValue[];
  culturePreset: CulturePreset;
  llmProvider: LlmProvider;
  defaultModel: string;
  seniorModel: string;
  budgetLimit: number;
  alertThreshold: number;
  overageBehavior: OverageBehavior;
  escalationBehavior: EscalationBehavior;
  port: number;
  deploy: boolean;
}

export interface InitFlags {
  template?: string;
  port?: number;
  deploy?: boolean;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export function defaultAnswers(): WizardAnswers {
  return {
    templateName: "assistant-team",
    orgName: "My Agent Team",
    mission: defaultConfig.alignment.mission,
    vision: defaultConfig.alignment.vision,
    values: [...defaultConfig.alignment.values],
    culturePreset: CulturePreset.Agency,
    llmProvider: LlmProvider.Anthropic,
    defaultModel: defaultConfig.llm.models.default,
    seniorModel: defaultConfig.llm.models.senior,
    budgetLimit: 500,
    alertThreshold: 0.8,
    overageBehavior: OverageBehavior.PauseAndEscalate,
    escalationBehavior: EscalationBehavior.Immediate,
    port: 8787,
    deploy: false,
  };
}

// ── Non-interactive from CLI flags ───────────────────────────────────────────

export function buildAnswersFromFlags(flags: InitFlags): WizardAnswers {
  const answers = defaultAnswers();

  if (flags.template !== undefined) {
    answers.templateName = flags.template;
    const tpl = getTemplate(flags.template);
    if (tpl) {
      answers.culturePreset = tpl.culturePreset;
    }
  }

  if (flags.port !== undefined) {
    answers.port = flags.port;
  }

  if (flags.deploy !== undefined) {
    answers.deploy = flags.deploy;
  }

  return answers;
}

// ── Cancel helper ────────────────────────────────────────────────────────────

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Setup cancelled.");
    process.exit(0);
  }
  return value;
}

// ── Interactive wizard ───────────────────────────────────────────────────────

export async function runWizard(): Promise<WizardAnswers> {
  intro("openspawn init");

  // eslint-disable-next-line no-constant-condition -- restart loop on rejection
  while (true) {
    const answers = await collectAnswers();

    // Confirmation summary
    const summary = [
      `Template:    ${answers.templateName}`,
      `Org name:    ${answers.orgName}`,
      `Culture:     ${answers.culturePreset}`,
      `LLM:         ${answers.llmProvider} (${answers.defaultModel})`,
      `Budget:      $${answers.budgetLimit}/period, alert at ${answers.alertThreshold * 100}%`,
      `Escalation:  ${answers.escalationBehavior}`,
      `Port:        ${answers.port}`,
      `Docker:      ${answers.deploy ? "yes" : "no"}`,
    ].join("\n");

    note(summary, "Configuration Summary");

    const ok = exitOnCancel(await confirm({ message: "Proceed with this configuration?" }));

    if (ok) {
      outro("Generating workspace...");
      return answers;
    }

    log.info("Starting over...\n");
  }
}

async function collectAnswers(): Promise<WizardAnswers> {
  const defaults = defaultAnswers();
  const templates = listTemplates();

  // ── Step 1: Template ─────────────────────────────────────────────────────
  const generalOptions = templates
    .filter((t) => t.category === "general")
    .map((t) => ({ value: t.name, label: `${t.emoji} ${t.label}`, hint: t.description }));

  const industryOptions = templates
    .filter((t) => t.category === "industry")
    .map((t) => ({ value: t.name, label: `${t.emoji} ${t.label}`, hint: t.description }));

  // Use groupMultiselect-style by showing all in one select
  const allOptions = [
    ...generalOptions.map((o) => ({ ...o, hint: `General — ${o.hint}` })),
    ...industryOptions.map((o) => ({ ...o, hint: `Industry — ${o.hint}` })),
  ];

  const templateName = exitOnCancel(
    await select({
      message: "Choose an org template",
      options: allOptions,
      initialValue: defaults.templateName,
    }),
  );

  const selectedTemplate = getTemplate(templateName);
  const templateCulture = selectedTemplate?.culturePreset ?? CulturePreset.Agency;

  // ── Step 2: Org name ─────────────────────────────────────────────────────
  const orgName = exitOnCancel(
    await text({
      message: "Organization name",
      placeholder: "My Agent Team",
      defaultValue: defaults.orgName,
    }),
  );

  // ── Step 3: Alignment ────────────────────────────────────────────────────
  const mission = exitOnCancel(
    await text({
      message: "Mission statement",
      defaultValue: defaults.mission,
      placeholder: defaults.mission,
    }),
  );

  const vision = exitOnCancel(
    await text({
      message: "Vision statement",
      defaultValue: defaults.vision,
      placeholder: defaults.vision,
    }),
  );

  const valueOptions = VALUE_DEFINITIONS.map((v) => ({
    value: v.value,
    label: v.label,
    hint: v.description,
  }));

  const selectedValues = exitOnCancel(
    await multiselect({
      message: "Select organizational values",
      options: valueOptions,
      initialValues: defaults.values,
      required: true,
    }),
  );

  // Show conflict warnings
  const conflicts = getConflicts(selectedValues);
  for (const conflict of conflicts) {
    log.warn(conflict);
  }

  const countWarning = formatValueWarning(selectedValues.length);
  if (countWarning) {
    log.warn(countWarning);
  }

  // ── Step 4: Culture ──────────────────────────────────────────────────────
  const culturePreset = exitOnCancel(
    await select({
      message: "Culture preset",
      options: Object.values(CulturePreset).map((p) => ({ value: p, label: p })),
      initialValue: templateCulture,
    }),
  );

  // ── Step 5: LLM ──────────────────────────────────────────────────────────
  const llmProvider = exitOnCancel(
    await select({
      message: "LLM provider",
      options: Object.values(LlmProvider).map((p) => ({ value: p, label: p })),
      initialValue: defaults.llmProvider,
    }),
  );

  const defaultModel = exitOnCancel(
    await text({
      message: "Default model",
      defaultValue: defaults.defaultModel,
      placeholder: defaults.defaultModel,
    }),
  );

  const seniorModel = exitOnCancel(
    await text({
      message: "Senior model (complex reasoning)",
      defaultValue: defaults.seniorModel,
      placeholder: defaults.seniorModel,
    }),
  );

  // ── Step 6: Budget ───────────────────────────────────────────────────────
  const budgetLimitStr = exitOnCancel(
    await text({
      message: "Per-agent budget limit (credits/period)",
      defaultValue: String(defaults.budgetLimit),
      placeholder: "500",
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0) return "Must be a positive number";
        return undefined;
      },
    }),
  );

  const alertThresholdStr = exitOnCancel(
    await text({
      message: "Alert threshold (0.0 - 1.0)",
      defaultValue: String(defaults.alertThreshold),
      placeholder: "0.8",
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || n > 1) return "Must be between 0 and 1";
        return undefined;
      },
    }),
  );

  const overageBehavior = exitOnCancel(
    await select({
      message: "Overage behavior",
      options: Object.values(OverageBehavior).map((b) => ({ value: b, label: b })),
      initialValue: defaults.overageBehavior,
    }),
  );

  // ── Step 7: Escalation ───────────────────────────────────────────────────
  const escalationBehavior = exitOnCancel(
    await select({
      message: "Escalation behavior",
      options: Object.values(EscalationBehavior).map((b) => ({ value: b, label: b })),
      initialValue: defaults.escalationBehavior,
    }),
  );

  // ── Step 8: Infrastructure ───────────────────────────────────────────────
  const portStr = exitOnCancel(
    await text({
      message: "Coordinator port",
      defaultValue: String(defaults.port),
      placeholder: "8787",
      validate: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 65535) return "Must be a valid port (1-65535)";
        return undefined;
      },
    }),
  );

  const deploy = exitOnCancel(
    await confirm({
      message: "Generate Docker infrastructure?",
      initialValue: defaults.deploy,
    }),
  );

  return {
    templateName,
    orgName,
    mission,
    vision,
    values: selectedValues,
    culturePreset,
    llmProvider,
    defaultModel,
    seniorModel,
    budgetLimit: Number(budgetLimitStr),
    alertThreshold: Number(alertThresholdStr),
    overageBehavior,
    escalationBehavior,
    port: Number(portStr),
    deploy,
  };
}
