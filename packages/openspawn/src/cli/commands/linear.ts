// ── Linear.app Integration CLI ───────────────────────────────────────────────

import chalk from "chalk";

const HELP = `
openspawn linear - Manage Linear.app integration

Subcommands:
  connect       Connect a Linear team to OpenSpawn
  sync          Configure sync direction for a connection
  status        Show all Linear connections and sync status
  disconnect    Remove a Linear connection

Usage:
  openspawn linear connect --api-key <key> --team <team-id> [--name <name>] [--direction both|from-linear|to-linear]
  openspawn linear sync --connection <id> --direction both|from-linear|to-linear
  openspawn linear status
  openspawn linear disconnect --connection <id> [--force]
`.trim();

export async function linearCommand(args: string[]) {
  const sub = args[0];
  const rest = args.slice(1);

  if (!sub || sub === "--help" || sub === "-h") {
    console.log(HELP);
    return;
  }

  switch (sub) {
    case "connect":
      return connectCmd(rest);
    case "sync":
      return syncCmd(rest);
    case "status":
      return statusCmd();
    case "disconnect":
      return disconnectCmd(rest);
    default:
      console.error(chalk.red(`Unknown subcommand: ${sub}`));
      console.log(HELP);
      process.exit(1);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function flag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return undefined;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function requireFlag(args: string[], name: string, label: string): string {
  const val = flag(args, name);
  if (!val) {
    console.error(chalk.red(`Missing required flag: ${name} (${label})`));
    process.exit(1);
  }
  return val;
}

function generateSecret(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function apiFetch(
  path: string,
  opts: RequestInit = {}
): Promise<Response> {
  const base =
    process.env.OPENSPAWN_API_URL ?? "http://localhost:8000";
  const token = process.env.OPENSPAWN_API_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${base}${path}`, { ...opts, headers });
}

// ── Subcommands ──────────────────────────────────────────────────────────────

async function connectCmd(args: string[]) {
  const apiKey = requireFlag(args, "--api-key", "Linear API key");
  const teamId = requireFlag(args, "--team", "Linear team ID");
  const name = flag(args, "--name") ?? "Linear";
  const direction = flag(args, "--direction") ?? "both";
  const webhookSecret = flag(args, "--webhook-secret") ?? generateSecret();

  const res = await apiFetch("/integrations/linear/connections", {
    method: "POST",
    body: JSON.stringify({
      team_id: teamId,
      name,
      api_key: apiKey,
      webhook_secret: webhookSecret,
      sync_config: { direction },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(
      chalk.red("✗ Failed to create connection:"),
      body.detail ?? res.statusText
    );
    process.exit(1);
  }

  const { data: conn } = await res.json();
  console.log(chalk.green("✓ Linear connection created"));
  console.log();
  console.log(`  ${chalk.bold("Connection ID:")} ${conn.id}`);
  console.log(`  ${chalk.bold("Team ID:")}       ${conn.team_id}`);
  console.log(`  ${chalk.bold("Name:")}          ${conn.name}`);
  console.log(`  ${chalk.bold("Sync:")}          ${direction}`);
  console.log();
  console.log(chalk.yellow("Webhook Setup:"));
  console.log(
    `  URL:    ${chalk.cyan("<your-api-url>/integrations/linear/webhook")}`
  );
  console.log(`  Secret: ${chalk.cyan(webhookSecret)}`);
  console.log();
  console.log(
    chalk.dim(
      "Configure this webhook URL in Linear → Settings → API → Webhooks"
    )
  );
}

async function syncCmd(args: string[]) {
  const connId = requireFlag(args, "--connection", "Connection ID");
  const direction = flag(args, "--direction");

  if (!direction) {
    console.error(chalk.red("Must specify --direction (both | from-linear | to-linear)"));
    process.exit(1);
  }

  const res = await apiFetch(`/integrations/linear/connections/${connId}`, {
    method: "PATCH",
    body: JSON.stringify({ sync_config: { direction } }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(
      chalk.red("✗ Failed to update sync config:"),
      body.detail ?? res.statusText
    );
    process.exit(1);
  }

  console.log(chalk.green("✓ Sync configuration updated"));
  console.log(`  Direction: ${direction}`);
}

async function statusCmd() {
  const res = await apiFetch("/integrations/linear/connections");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(
      chalk.red("✗ Failed to fetch status:"),
      body.detail ?? res.statusText
    );
    process.exit(1);
  }

  const { data: connections } = await res.json();

  if (!connections || connections.length === 0) {
    console.log(chalk.yellow("No Linear connections configured."));
    console.log(chalk.dim("Run `openspawn linear connect` to get started."));
    return;
  }

  console.log(chalk.bold("Linear Connections:"));
  console.log();

  for (const conn of connections) {
    const icon = conn.enabled ? "🟢" : "🔴";
    const direction = conn.sync_config?.direction ?? "both";

    console.log(`${icon} ${chalk.bold(conn.name)} (${chalk.dim(conn.id)})`);
    console.log(`   Team:       ${conn.team_id}`);
    console.log(`   Sync:       ${direction}`);
    console.log(`   Enabled:    ${conn.enabled}`);
    console.log(`   Last sync:  ${conn.last_sync_at ?? chalk.dim("never")}`);
    if (conn.last_error) {
      console.log(`   Last error: ${chalk.red(conn.last_error)}`);
    }
    console.log();
  }
}

async function disconnectCmd(args: string[]) {
  const connId = requireFlag(args, "--connection", "Connection ID");
  const force = hasFlag(args, "--force");

  if (!force) {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await new Promise<string>((resolve) =>
      rl.question(
        chalk.yellow(
          "This will remove the connection and stop syncing. Continue? (y/N) "
        ),
        resolve
      )
    );
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      return;
    }
  }

  const res = await apiFetch(
    `/integrations/linear/connections/${connId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(
      chalk.red("✗ Failed to remove connection:"),
      body.detail ?? res.statusText
    );
    process.exit(1);
  }

  console.log(chalk.green("✓ Linear connection removed"));
}
