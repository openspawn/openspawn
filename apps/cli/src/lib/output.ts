import pc from "picocolors";
import Table from "cli-table3";
import figures from "figures";

let outputJson = false;

export function setJsonOutput(enabled: boolean): void {
  outputJson = enabled;
}

export function isJsonOutput(): boolean {
  return outputJson;
}

// ═══════════════════════════════════════════════════════════════
// 🎨 Color Palette
// ═══════════════════════════════════════════════════════════════

export const colors = {
  primary: pc.cyan,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  muted: pc.gray,
  bold: pc.bold,
  dim: pc.dim,
  underline: pc.underline,
  agent: pc.magenta,
  task: pc.blue,
  credit: pc.yellow,
  level: (n: number) => {
    if (n >= 9) return pc.magenta;
    if (n >= 7) return pc.green;
    if (n >= 5) return pc.cyan;
    if (n >= 3) return pc.yellow;
    return pc.gray;
  },
};

// ═══════════════════════════════════════════════════════════════
// 🔣 Icons
// ═══════════════════════════════════════════════════════════════

export const icons = {
  success: pc.green(figures.tick),
  error: pc.red(figures.cross),
  warning: pc.yellow(figures.warning),
  info: pc.blue(figures.info),
  bullet: pc.dim(figures.bullet),
  arrow: pc.dim(figures.arrowRight),
  pointer: pc.cyan(figures.pointer),
  agent: "🤖",
  task: "📋",
  credit: "💰",
  key: "🔑",
  lock: "🔒",
  check: "✓",
  cross: "✗",
  star: "⭐",
  fire: "🔥",
  rocket: "🚀",
  lightning: "⚡",
};

// ═══════════════════════════════════════════════════════════════
// 📊 Output Functions
// ═══════════════════════════════════════════════════════════════

export function output(data: unknown): void {
  if (outputJson) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function outputSuccess(message: string): void {
  if (outputJson) {
    console.log(JSON.stringify({ success: true, message }));
  } else {
    console.log(`${icons.success} ${pc.green(message)}`);
  }
}

export function outputError(message: string, hint?: string): void {
  if (outputJson) {
    console.error(JSON.stringify({ error: message, hint }));
  } else {
    console.error(`${icons.error} ${pc.red(pc.bold("Error:"))} ${message}`);
    if (hint) {
      console.error(`   ${pc.dim(figures.arrowRight)} ${pc.dim(hint)}`);
    }
  }
}

export function outputWarning(message: string): void {
  if (outputJson) {
    console.log(JSON.stringify({ warning: message }));
  } else {
    console.log(`${icons.warning} ${pc.yellow(message)}`);
  }
}

export function outputInfo(message: string): void {
  if (outputJson) {
    console.log(JSON.stringify({ info: message }));
  } else {
    console.log(`${icons.info} ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📋 Table Formatting
// ═══════════════════════════════════════════════════════════════

interface TableOptions {
  headers: string[];
  rows: (string | number)[][];
  colors?: boolean;
}

export function outputTable({ headers, rows, colors = true }: TableOptions): void {
  if (outputJson) {
    const data = rows.map((row) => {
      const obj: Record<string, string | number> = {};
      headers.forEach((h, i) => {
        obj[h.toLowerCase().replace(/\s+/g, "_")] = row[i] ?? "";
      });
      return obj;
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const table = new Table({
    head: headers.map((h) => (colors ? pc.cyan(pc.bold(h)) : h)),
    style: {
      head: [],
      border: [],
    },
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
  });

  for (const row of rows) {
    table.push(row.map((cell) => String(cell)));
  }

  console.log(table.toString());
}

// ═══════════════════════════════════════════════════════════════
// 🎯 Specialized Formatters
// ═══════════════════════════════════════════════════════════════

export function formatAgent(agent: {
  id: string;
  agentId: string;
  name: string;
  level: number;
  status: string;
  currentBalance?: number;
}): void {
  if (outputJson) {
    output(agent);
    return;
  }

  const levelColor = colors.level(agent.level);
  const statusColor = agent.status === "ACTIVE" ? colors.success : colors.muted;

  console.log();
  console.log(`  ${icons.agent} ${pc.bold(agent.name)}`);
  console.log(`     ${pc.dim("ID:")} ${agent.agentId}`);
  console.log(`     ${pc.dim("Level:")} ${levelColor(pc.bold(`L${agent.level}`))}`);
  console.log(`     ${pc.dim("Status:")} ${statusColor(agent.status)}`);
  if (agent.currentBalance !== undefined) {
    console.log(`     ${pc.dim("Balance:")} ${colors.credit(`${agent.currentBalance.toLocaleString()} credits`)}`);
  }
  console.log();
}

export function formatTask(task: {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string } | null;
}): void {
  if (outputJson) {
    output(task);
    return;
  }

  const statusColors: Record<string, (s: string) => string> = {
    DONE: colors.success,
    IN_PROGRESS: pc.magenta,
    REVIEW: pc.yellow,
    TODO: pc.cyan,
    BACKLOG: colors.muted,
    BLOCKED: colors.error,
  };
  const priorityColors: Record<string, (s: string) => string> = {
    CRITICAL: colors.error,
    HIGH: pc.yellow,
    MEDIUM: colors.primary,
    LOW: colors.muted,
  };

  const statusColor = statusColors[task.status] || colors.muted;
  const priorityColor = priorityColors[task.priority] || colors.muted;

  console.log();
  console.log(`  ${icons.task} ${pc.bold(task.title)}`);
  console.log(`     ${pc.dim("ID:")} ${task.identifier}`);
  console.log(`     ${pc.dim("Status:")} ${statusColor(task.status)}`);
  console.log(`     ${pc.dim("Priority:")} ${priorityColor(task.priority)}`);
  if (task.assignee) {
    console.log(`     ${pc.dim("Assignee:")} ${icons.agent} ${task.assignee.name}`);
  } else {
    console.log(`     ${pc.dim("Assignee:")} ${pc.dim("Unassigned")}`);
  }
  console.log();
}

export function formatCredits(balance: number, label = "Balance"): void {
  if (outputJson) {
    output({ label, balance });
    return;
  }

  console.log();
  console.log(`  ${icons.credit} ${pc.dim(label + ":")} ${colors.credit(pc.bold(balance.toLocaleString()))} credits`);
  console.log();
}

// ═══════════════════════════════════════════════════════════════
// 🎨 Banner & Branding
// ═══════════════════════════════════════════════════════════════

export function printBanner(): void {
  if (outputJson) return;

  const banner = `
  ${pc.cyan("╔═══════════════════════════════════════╗")}
  ${pc.cyan("║")}  ${icons.rocket} ${pc.bold(pc.white("OpenSpawn"))} ${pc.dim("CLI")}                    ${pc.cyan("║")}
  ${pc.cyan("║")}  ${pc.dim("Multi-agent coordination platform")}    ${pc.cyan("║")}
  ${pc.cyan("╚═══════════════════════════════════════╝")}
`;
  console.log(banner);
}

export function printCompactBanner(): void {
  if (outputJson) return;
  console.log(`${icons.rocket} ${pc.cyan(pc.bold("OpenSpawn"))} ${pc.dim("CLI v0.1.0")}`);
}

// ═══════════════════════════════════════════════════════════════
// 📊 Progress & Status
// ═══════════════════════════════════════════════════════════════

export function formatStatus(isConnected: boolean, apiUrl: string): void {
  if (outputJson) {
    output({ connected: isConnected, apiUrl });
    return;
  }

  console.log();
  if (isConnected) {
    console.log(`  ${icons.success} ${pc.green("Connected")} to ${pc.underline(apiUrl)}`);
  } else {
    console.log(`  ${icons.error} ${pc.red("Not connected")}`);
    console.log(`     ${pc.dim("Run:")} ${pc.cyan("openspawn auth login --api-key <key>")}`);
  }
  console.log();
}

export function formatKeyValue(items: Record<string, string | number | boolean | undefined>): void {
  if (outputJson) {
    output(items);
    return;
  }

  const maxKeyLen = Math.max(...Object.keys(items).map((k) => k.length));
  
  console.log();
  for (const [key, value] of Object.entries(items)) {
    if (value === undefined) continue;
    const paddedKey = key.padEnd(maxKeyLen);
    console.log(`  ${pc.dim(paddedKey)}  ${value}`);
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════
// 🎭 Empty States
// ═══════════════════════════════════════════════════════════════

export function formatEmpty(message: string, hint?: string): void {
  if (outputJson) {
    output({ empty: true, message, hint });
    return;
  }

  console.log();
  console.log(`  ${pc.dim(message)}`);
  if (hint) {
    console.log(`  ${pc.dim(figures.arrowRight)} ${hint}`);
  }
  console.log();
}
