import ora, { type Ora } from "ora";
import pc from "picocolors";
import figures from "figures";
import { isJsonOutput } from "./output.js";

let activeSpinner: Ora | null = null;

export function startSpinner(text: string): Ora | null {
  if (isJsonOutput()) return null;

  // Stop any existing spinner
  if (activeSpinner) {
    activeSpinner.stop();
  }

  activeSpinner = ora({
    text,
    color: "cyan",
    spinner: "dots",
  }).start();

  return activeSpinner;
}

export function stopSpinner(success = true, text?: string): void {
  if (!activeSpinner) return;

  if (success) {
    activeSpinner.succeed(text || activeSpinner.text);
  } else {
    activeSpinner.fail(text || activeSpinner.text);
  }

  activeSpinner = null;
}

export function updateSpinner(text: string): void {
  if (activeSpinner) {
    activeSpinner.text = text;
  }
}

/**
 * Run an async operation with a spinner
 */
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  options: {
    successText?: string | ((result: T) => string);
    failText?: string;
  } = {}
): Promise<T> {
  const spinner = startSpinner(text);

  try {
    const result = await operation();
    
    const successMsg = typeof options.successText === "function"
      ? options.successText(result)
      : options.successText || text;
    
    stopSpinner(true, successMsg);
    return result;
  } catch (error) {
    stopSpinner(false, options.failText || text);
    throw error;
  }
}

/**
 * Format duration in human readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Create a simple progress indicator
 */
export function progressBar(current: number, total: number, width = 20): string {
  const percent = Math.min(1, current / total);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  
  const bar = pc.cyan("█".repeat(filled)) + pc.dim("░".repeat(empty));
  const pct = pc.bold(`${Math.round(percent * 100)}%`);
  
  return `${bar} ${pct}`;
}
