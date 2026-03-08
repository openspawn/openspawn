import type { Template } from "./types.js";
import { generalTemplates } from "./general.js";
import { industryTemplates } from "./industry.js";

export type { Template };

const ALL_TEMPLATES: Template[] = [...generalTemplates(), ...industryTemplates()];

export function listTemplates(): Template[] {
  return ALL_TEMPLATES;
}

export function getTemplate(name: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.name === name);
}

export function renderTemplate(template: Template, teamName: string): string {
  return template.content.replaceAll("{{TEAM_NAME}}", teamName);
}
