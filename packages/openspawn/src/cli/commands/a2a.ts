// ── A2A Command ──────────────────────────────────────────────────────────────
// CLI for interacting with the local A2A router.

const A2A_BASE = process.env.A2A_URL ?? "http://127.0.0.1:3380";

const A2A_HELP = `
openspawn a2a - Agent-to-Agent communication

Usage:
  openspawn a2a send <agent-id> <message> [--async]   Send message to agent
  openspawn a2a agents                                 List registered agents
  openspawn a2a tasks                                  List all tasks
  openspawn a2a task <task-id>                         Get task status + result
  openspawn a2a register                               Register this agent

Options:
  --async          Return task ID immediately (don't wait for completion)
  --sender <id>    Sender agent ID (default: from IDENTITY.md or "dennis")
  --timeout <sec>  Polling timeout in seconds (default: 600)

Examples:
  openspawn a2a send drinkify "Check git status of drinkify repo"
  openspawn a2a send drinkify "Deploy staging" --async
  openspawn a2a agents
  openspawn a2a task abc-123
`.trim();

async function fetchJson(path: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${A2A_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1];
  }
  return undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

interface Task {
  id: string;
  sender_id: string;
  target_id: string;
  message: string;
  status: string;
  result: string | null;
  created_at: string;
  updated_at: string;
}

interface Agent {
  agent_id: string;
  name: string;
  skills: string[];
  gateway_url: string;
  hook_path: string;
  registered_at: string;
}

async function sendCommand(args: string[]): Promise<void> {
  // Remove flags to get positional args
  const cleanArgs: string[] = [];
  const flagsToSkip = new Set(["--async", "--sender", "--timeout"]);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sender" || args[i] === "--timeout") {
      i++; // skip value
    } else if (!flagsToSkip.has(args[i])) {
      cleanArgs.push(args[i]);
    }
  }

  const agentId = cleanArgs[0];
  const message = cleanArgs.slice(1).join(" ");
  const isAsync = hasFlag(args, "--async");
  const senderId = parseFlag(args, "--sender") ?? "dennis";
  const timeout = parseInt(parseFlag(args, "--timeout") ?? "600", 10);

  if (!agentId || !message) {
    console.error("Usage: openspawn a2a send <agent-id> <message>");
    process.exit(1);
  }

  const { status, body } = await fetchJson("/a2a/message/send", {
    method: "POST",
    body: JSON.stringify({ agentId, senderId, message }),
  });

  if (status !== 201) {
    const err = body as { error?: string };
    console.error(`❌ Failed to send message: ${err?.error ?? `HTTP ${status}`}`);
    process.exit(1);
  }

  const task = body as Task;
  console.log(`📤 Task created: ${task.id}`);
  console.log(`   Target: ${task.target_id} | Status: ${task.status}`);

  if (isAsync) {
    console.log(`\n   Use: openspawn a2a task ${task.id}`);
    return;
  }

  // Poll for completion
  console.log("\n⏳ Waiting for completion...");
  const deadline = Date.now() + timeout * 1000;
  const pollInterval = 5000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const { status: pStatus, body: pBody } = await fetchJson(`/a2a/tasks/${task.id}`);
    if (pStatus !== 200) continue;

    const current = pBody as Task;
    if (current.status === "completed") {
      console.log(`\n✅ Task completed!`);
      if (current.result) console.log(`\n${current.result}`);
      return;
    }
    if (current.status === "failed") {
      console.log(`\n❌ Task failed!`);
      if (current.result) console.log(`\n${current.result}`);
      process.exit(1);
    }
    if (current.status === "canceled") {
      console.log(`\n⚠️  Task canceled`);
      process.exit(1);
    }

    process.stdout.write(".");
  }

  console.log(`\n⏰ Timeout after ${timeout}s. Task ${task.id} is still ${task.status}`);
  process.exit(1);
}

async function agentsCommand(): Promise<void> {
  const { status, body } = await fetchJson("/a2a/agents");
  if (status !== 200) {
    console.error("❌ Failed to list agents");
    process.exit(1);
  }

  const agents = body as Agent[];
  if (agents.length === 0) {
    console.log("No agents registered.");
    return;
  }

  console.log(`\n📋 Registered Agents (${agents.length}):\n`);
  for (const a of agents) {
    console.log(`  ${a.agent_id} — ${a.name}`);
    console.log(`    Skills: ${a.skills.join(", ") || "none"}`);
    console.log(`    Gateway: ${a.gateway_url}${a.hook_path}`);
    console.log();
  }
}

async function tasksCommand(): Promise<void> {
  const { status, body } = await fetchJson("/a2a/tasks");
  if (status !== 200) {
    console.error("❌ Failed to list tasks");
    process.exit(1);
  }

  const tasks = body as Task[];
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  console.log(`\n📋 Tasks (${tasks.length}):\n`);
  for (const t of tasks) {
    const statusIcon = t.status === "completed" ? "✅" : t.status === "failed" ? "❌" : t.status === "working" ? "⏳" : "📝";
    console.log(`  ${statusIcon} ${t.id}`);
    console.log(`    ${t.sender_id} → ${t.target_id} | ${t.status}`);
    console.log(`    ${t.message.slice(0, 80)}${t.message.length > 80 ? "..." : ""}`);
    if (t.result) console.log(`    Result: ${t.result.slice(0, 100)}${t.result.length > 100 ? "..." : ""}`);
    console.log();
  }
}

async function taskCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  if (!taskId) {
    console.error("Usage: openspawn a2a task <task-id>");
    process.exit(1);
  }

  const { status, body } = await fetchJson(`/a2a/tasks/${taskId}`);
  if (status === 404) {
    console.error(`❌ Task '${taskId}' not found`);
    process.exit(1);
  }
  if (status !== 200) {
    console.error("❌ Failed to get task");
    process.exit(1);
  }

  const t = body as Task;
  const statusIcon = t.status === "completed" ? "✅" : t.status === "failed" ? "❌" : t.status === "working" ? "⏳" : "📝";
  console.log(`\n${statusIcon} Task ${t.id}\n`);
  console.log(`  Status:  ${t.status}`);
  console.log(`  From:    ${t.sender_id}`);
  console.log(`  To:      ${t.target_id}`);
  console.log(`  Created: ${t.created_at}`);
  console.log(`  Updated: ${t.updated_at}`);
  console.log(`\n  Message: ${t.message}`);
  if (t.result) console.log(`\n  Result: ${t.result}`);
  console.log();
}

async function registerCommand(): Promise<void> {
  // Default: register as dennis
  console.log("⚠️  Registration requires agent config. Use the API directly:");
  console.log(`\n  curl -X POST ${A2A_BASE}/a2a/agents \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"agentId":"YOUR_ID","name":"YOUR_NAME","gateway_url":"http://127.0.0.1:PORT","skills":[]}'`);
}

export async function a2aCommand(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(A2A_HELP);
    return;
  }

  const sub = args[0];
  const rest = args.slice(1);

  try {
    switch (sub) {
      case "send":
        return await sendCommand(rest);
      case "agents":
        return await agentsCommand();
      case "tasks":
        return await tasksCommand();
      case "task":
        return await taskCommand(rest);
      case "register":
        return await registerCommand();
      default:
        console.error(`Unknown a2a subcommand: ${sub}`);
        console.log(A2A_HELP);
        process.exit(1);
    }
  } catch (err) {
    if (err instanceof TypeError && (err as Error).message.includes("fetch")) {
      console.error("❌ Cannot reach A2A router. Is it running?");
      console.error(`   Expected at: ${A2A_BASE}`);
      console.error("   Start it: cd tools/a2a-router && npm run dev");
      process.exit(1);
    }
    throw err;
  }
}
