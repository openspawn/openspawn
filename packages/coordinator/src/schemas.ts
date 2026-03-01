import { z } from 'zod';

/**
 * Structured task result — agents must return one of these typed variants
 * when calling task_complete. Use `freeform` as an escape hatch when no
 * other type fits (but prefer a concrete type).
 */
export const TaskResultSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pr_merged'),
    pr: z.number(),
    branch: z.string().optional(),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('file_created'),
    paths: z.array(z.string()),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('docs_updated'),
    files: z.array(z.string()),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('config_changed'),
    changes: z.array(z.string()),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('research_complete'),
    findings: z.string(),
    sources: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('error'),
    reason: z.string(),
    recoverable: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('escalation'),
    issue: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
  }),
  z.object({
    type: z.literal('freeform'),
    text: z.string(),
    // Escape hatch for results that don't fit other types — use sparingly.
  }),
]);

export type TaskResult = z.infer<typeof TaskResultSchema>;

/**
 * Parse a raw result value (string or object) into a validated TaskResult.
 *
 * - Plain string  → wrapped as `{ type: 'freeform', text }`  (backward compat)
 * - JSON string   → parsed then validated against TaskResultSchema
 * - Object        → validated against TaskResultSchema directly
 *
 * Throws a ZodError if the value is a non-freeform object that fails validation.
 */
export function parseTaskResult(raw: unknown): TaskResult {
  if (typeof raw === 'string') {
    // Try to parse as JSON first; if it fails treat as freeform text.
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Plain string → freeform wrapper (backward compat)
      return { type: 'freeform', text: raw };
    }
    return TaskResultSchema.parse(parsed);
  }

  if (raw !== null && typeof raw === 'object') {
    return TaskResultSchema.parse(raw);
  }

  // Fallback: wrap whatever we got as freeform text
  return { type: 'freeform', text: String(raw) };
}
