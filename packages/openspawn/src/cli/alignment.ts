import { OrgValue } from "../core/types.js";

export interface ValueDefinition {
  value: OrgValue;
  label: string;
  description: string;
  source: string;
  conflictsWith?: OrgValue;
  isDefault: boolean;
}

export const VALUE_DEFINITIONS: ValueDefinition[] = [
  {
    value: OrgValue.Ownership,
    label: "Ownership",
    description: "Every task has exactly one owner; it ships or it escalates",
    source: "Katzenbach & Smith, 'The Discipline of Teams'",
    isDefault: true,
  },
  {
    value: OrgValue.Transparency,
    label: "Transparency",
    description: "Surface problems early; silent failure is the worst outcome",
    source: "Amy Edmondson, psychological safety",
    isDefault: true,
  },
  {
    value: OrgValue.Measurement,
    label: "Measurement",
    description: "Track outcomes, not activity; if you can't measure it, don't claim it",
    source: "Peter Drucker, management by objectives",
    isDefault: true,
  },
  {
    value: OrgValue.Subsidiarity,
    label: "Subsidiarity",
    description: "Decisions made at the lowest competent level; don't escalate what you can solve",
    source: "Rogers & Blenko, 'Who Has the D?'",
    isDefault: true,
  },
  {
    value: OrgValue.ContinuousImprovement,
    label: "Continuous Improvement",
    description: "Document every mistake, update process, never repeat",
    source: "Peter Senge, learning organizations",
    isDefault: true,
  },
  {
    value: OrgValue.Speed,
    label: "Speed",
    description: "Bias toward action; ship small, iterate fast",
    source: "",
    conflictsWith: OrgValue.Rigor,
    isDefault: false,
  },
  {
    value: OrgValue.Rigor,
    label: "Rigor",
    description: "Depth over speed; verify before asserting",
    source: "",
    conflictsWith: OrgValue.Speed,
    isDefault: false,
  },
  {
    value: OrgValue.Frugality,
    label: "Frugality",
    description: "Prefer cheap models for mechanical tasks; expensive models only for reasoning",
    source: "",
    isDefault: false,
  },
];

export const DEFAULT_VALUES: OrgValue[] = VALUE_DEFINITIONS
  .filter((v) => v.isDefault)
  .map((v) => v.value);

export function getConflicts(selected: string[]): string[] {
  const conflicts: string[] = [];
  for (const def of VALUE_DEFINITIONS) {
    if (
      def.conflictsWith &&
      selected.includes(def.value) &&
      selected.includes(def.conflictsWith)
    ) {
      const other = VALUE_DEFINITIONS.find((d) => d.value === def.conflictsWith);
      if (other) {
        const msg = `${def.label} conflicts with ${other.label}`;
        const reverse = `${other.label} conflicts with ${def.label}`;
        if (!conflicts.includes(msg) && !conflicts.includes(reverse)) {
          conflicts.push(msg);
        }
      }
    }
  }
  return conflicts;
}

export function formatValueWarning(count: number): string | undefined {
  if (count <= 5) return undefined;
  return `You selected ${count} values. More than 5 increases per-session token cost and may create conflicting guidance.`;
}
