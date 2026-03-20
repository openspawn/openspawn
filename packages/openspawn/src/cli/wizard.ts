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
  customizedAlignment: boolean;
}

export interface InitFlags {
  template?: string;
  port?: number;
  deploy?: boolean;
  lowCost?: boolean;
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
    customizedAlignment: false,
  };
}

// ── Non-interactive from CLI flags ───────────────────────────────────────────

export const LOW_COST_DEFAULTS = {
  llmProvider: LlmProvider.OpenAI,
  defaultModel: "gpt-4o-mini",
  seniorModel: "gpt-4o-mini",
  strategicModel: "claude-sonnet-4-20250514",
} as const;

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

  if (flags.lowCost) {
    answers.llmProvider = LOW_COST_DEFAULTS.llmProvider;
    answers.defaultModel = LOW_COST_DEFAULTS.defaultModel;
    answers.seniorModel = LOW_COST_DEFAULTS.seniorModel;
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

  while (true) {
    const answers = await collectAnswers();

    const tpl = getTemplate(answers.templateName);
    const templateDisplay = tpl ? `${tpl.emoji} ${tpl.label}` : answers.templateName;

    const lines = [
      `Template:  ${templateDisplay}`,
      `Org name:  ${answers.orgName}`,
      `LLM:       ${answers.llmProvider}`,
      `  Default: ${answers.defaultModel} (L1\u2013L6)`,
      `  Senior:  ${answers.seniorModel} (L7+)`,
      `Budget:    ${answers.budgetLimit} credits/week`,
      `Port:      ${answers.port}`,
      `Docker:    ${answers.deploy ? "yes" : "no"}`,
    ];

    if (answers.customizedAlignment) {
      const missionPreview =
        answers.mission.length > 60 ? `${answers.mission.slice(0, 60)}\u2026` : answers.mission;
      lines.splice(
        2,
        0,
        `Mission:   ${missionPreview}`,
        `Values:    ${answers.values.length} selected`,
      );
    }

    note(lines.join("\n"), "Configuration Summary");

    const ok = exitOnCancel(await confirm({ message: "Proceed with this configuration?" }));

    if (ok) {
      outro("Generating workspace...");
      return answers;
    }

    log.info("Starting over...\n");
  }
}

// ── Prompt collection ────────────────────────────────────────────────────────

async function collectAnswers(): Promise<WizardAnswers> {
  const defaults = defaultAnswers();
  const templates = listTemplates();

  // ── Step 1 of 3: Organization ─────────────────────────────────────────────

  note(
    "Pick a starting template for your agent team. Each template\n" +
      "defines agent roles, hierarchy, and coordination policies.\n" +
      "You can customize everything in ORG.md later.",
    "Step 1 of 3 \u00B7 Organization",
  );

  const templateOptions = [
    ...templates
      .filter((t) => t.category === "general")
      .map((t) => ({
        value: t.name,
        label: `${t.emoji} ${t.label}`,
        hint: `General \u00B7 ${t.description}`,
      })),
    ...templates
      .filter((t) => t.category === "industry")
      .map((t) => ({
        value: t.name,
        label: `${t.emoji} ${t.label}`,
        hint: `Industry \u00B7 ${t.description}`,
      })),
  ];

  const templateName = exitOnCancel(
    await select({
      message: "Choose a starting template",
      options: templateOptions,
      initialValue: defaults.templateName,
    }),
  );

  const selectedTemplate = getTemplate(templateName);
  const templateCulture = selectedTemplate?.culturePreset ?? CulturePreset.Agency;

  const orgName = exitOnCancel(
    await text({
      message: "Organization name",
      placeholder: "My Agent Team",
      defaultValue: defaults.orgName,
    }),
  );

  // ── Step 2 of 3: AI Models ────────────────────────────────────────────────

  note(
    "Which LLM powers your agents. Lower-level agents (L1\u2013L6)\n" +
      "use the default model. Leads and execs (L7+) use a more\n" +
      "capable model for reasoning and delegation.",
    "Step 2 of 3 \u00B7 AI Models",
  );

  const llmProvider = exitOnCancel(
    await select({
      message: "LLM provider",
      options: [
        { value: LlmProvider.Anthropic, label: "Anthropic", hint: "Claude models via API" },
        { value: LlmProvider.OpenAI, label: "OpenAI", hint: "GPT models via API" },
        { value: LlmProvider.Ollama, label: "Ollama", hint: "Local models, free, no API key" },
        { value: LlmProvider.Groq, label: "Groq", hint: "Fast inference, Llama / Mixtral" },
        {
          value: LlmProvider.OpenRouter,
          label: "OpenRouter",
          hint: "Multi-provider gateway",
        },
      ],
      initialValue: defaults.llmProvider,
    }),
  );

  const defaultModel = exitOnCancel(
    await text({
      message: "Default model (L1\u2013L6 agents)",
      defaultValue: defaults.defaultModel,
      placeholder: defaults.defaultModel,
    }),
  );

  const seniorModel = exitOnCancel(
    await text({
      message: "Senior model (L7+ leads & execs)",
      defaultValue: defaults.seniorModel,
      placeholder: defaults.seniorModel,
    }),
  );

  // ── Step 3 of 3: Infrastructure ───────────────────────────────────────────

  note(
    "Local coordinator settings. You can change these\n" + "anytime in openspawn.json.",
    "Step 3 of 3 \u00B7 Infrastructure",
  );

  const portStr = exitOnCancel(
    await text({
      message: "Coordinator port",
      defaultValue: String(defaults.port),
      placeholder: "8787",
      validate: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 65535)
          return "Must be a valid port (1\u201365535)";
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

  // ── Optional: Customize alignment & budget ────────────────────────────────

  const customize = exitOnCancel(
    await confirm({
      message: "Customize alignment & budget? (template defaults are good to start)",
      initialValue: false,
    }),
  );

  let mission = defaults.mission;
  let vision = defaults.vision;
  let selectedValues = [...defaults.values];
  let budgetLimit = defaults.budgetLimit;
  let customizedAlignment = false;

  if (customize) {
    customizedAlignment = true;

    // ── Optional · Alignment ──────────────────────────────────────────────

    note(
      "Alignment shapes how agents decide when unsupervised.\n" +
        "Mission and vision are injected into every agent's system\n" +
        "prompt \u2014 keep them short and actionable.",
      "Optional \u00B7 Alignment",
    );

    mission = exitOnCancel(
      await text({
        message: "Mission \u2014 what should your agents optimize for?",
        defaultValue: defaults.mission,
        placeholder: defaults.mission,
      }),
    );

    vision = exitOnCancel(
      await text({
        message: "Vision \u2014 what does success look like?",
        defaultValue: defaults.vision,
        placeholder: defaults.vision,
      }),
    );

    const valueOptions = VALUE_DEFINITIONS.map((v) => ({
      value: v.value,
      label: v.label,
      hint: v.description,
    }));

    selectedValues = exitOnCancel(
      await multiselect({
        message: "Organizational values (injected into agent prompts)",
        options: valueOptions,
        initialValues: defaults.values,
        required: true,
      }),
    );

    const conflicts = getConflicts(selectedValues);
    for (const conflict of conflicts) {
      log.warn(conflict);
    }

    const countWarning = formatValueWarning(selectedValues.length);
    if (countWarning) {
      log.warn(countWarning);
    }

    // ── Optional · Budget ─────────────────────────────────────────────────

    note(
      "Each agent gets a credit limit per billing period. When\n" +
        "an agent hits the limit, work pauses until approved.",
      "Optional \u00B7 Budget",
    );

    const budgetLimitStr = exitOnCancel(
      await text({
        message: "Per-agent budget limit (credits/week)",
        defaultValue: String(defaults.budgetLimit),
        placeholder: "500",
        validate: (v) => {
          const n = Number(v);
          if (Number.isNaN(n) || n <= 0) return "Must be a positive number";
          return undefined;
        },
      }),
    );

    budgetLimit = Number(budgetLimitStr);
  }

  return {
    templateName,
    orgName,
    mission,
    vision,
    values: selectedValues,
    culturePreset: templateCulture,
    llmProvider,
    defaultModel,
    seniorModel,
    budgetLimit,
    alertThreshold: defaults.alertThreshold,
    overageBehavior: defaults.overageBehavior,
    escalationBehavior: defaults.escalationBehavior,
    port: Number(portStr),
    deploy,
    customizedAlignment,
  };
}
