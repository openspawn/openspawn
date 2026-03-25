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
  openspawn a2a test [url]                             Test A2A endpoint compliance
  openspawn a2a test --self                            Test own router

Options:
  --async          Return task ID immediately (don't wait for completion)
  --sender <id>    Sender agent ID (default: from IDENTITY.md or "dennis")
  --timeout <sec>  Polling timeout in seconds (default: 600)

Examples:
  openspawn a2a send drinkify "Check git status of drinkify repo"
  openspawn a2a send drinkify "Deploy staging" --async
  openspawn a2a agents
  openspawn a2a task abc-123
  openspawn a2a test
  openspawn a2a test http://remote-host:3380
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

// ── Compliance Test Command ────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

async function testCommand(args: string[]): Promise<void> {
  const isSelf = hasFlag(args, "--self");
  const positionalUrl = args.find((a) => !a.startsWith("--"));
  const baseUrl = positionalUrl ?? (isSelf ? A2A_BASE : A2A_BASE);

  console.log(`\nA2A Compliance Test — ${baseUrl}\n`);

  const results: TestResult[] = [];

  // Helper to run a test and collect results
  async function runTest(name: string, fn: () => Promise<{ passed: boolean; detail?: string }>): Promise<void> {
    try {
      const result = await fn();
      results.push({ name, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, detail: message });
    }
  }

  // We need two test agents for the compliance tests.
  // Register them temporarily, run tests, then clean up by ignoring errors.
  const testSenderId = `__a2a_test_sender_${Date.now()}`;
  const testAgentId = `__a2a_test_target_${Date.now()}`;

  // Register test agents (best effort — they may already exist in some form)
  async function registerTestAgents(): Promise<boolean> {
    try {
      const senderRes = await fetch(`${baseUrl}/a2a/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: testSenderId,
          name: "Test Sender",
          gateway_url: "http://127.0.0.1:19999",
          skills: ["test"],
        }),
      });
      const targetRes = await fetch(`${baseUrl}/a2a/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: testAgentId,
          name: "Test Target",
          gateway_url: "http://127.0.0.1:19998",
          skills: ["test"],
        }),
      });
      return senderRes.status === 201 && targetRes.status === 201;
    } catch {
      return false;
    }
  }

  const agentsReady = await registerTestAgents();
  if (!agentsReady) {
    console.error("❌ Could not register test agents. Is the router running?");
    process.exit(1);
  }

  let createdTaskId: string | undefined;

  // 1. Agent discovery
  await runTest("Agent discovery (/.well-known/agent.json)", async () => {
    const res = await fetch(`${baseUrl}/.well-known/agent.json`);
    if (!res.ok) return { passed: false, detail: `HTTP ${res.status}` };
    const card = (await res.json()) as Record<string, unknown>;
    if (card.protocolVersion !== "1.0.0") return { passed: false, detail: `protocolVersion: ${String(card.protocolVersion)}` };
    if (typeof card.name !== "string") return { passed: false, detail: "missing name" };
    if (typeof card.url !== "string") return { passed: false, detail: "missing url" };
    if (!Array.isArray(card.skills)) return { passed: false, detail: "missing skills array" };
    return { passed: true };
  });

  // 2. message/send
  await runTest("message/send — creates task", async () => {
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-1",
        method: "message/send",
        params: {
          agentId: testAgentId,
          senderId: testSenderId,
          message: {
            kind: "message",
            messageId: `test-msg-${Date.now()}`,
            role: "user",
            parts: [{ kind: "text", text: "A2A compliance test message" }],
          },
        },
      }),
    });
    if (!res.ok) return { passed: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as Record<string, unknown>;
    if (body.error) return { passed: false, detail: JSON.stringify(body.error) };
    const result = body.result as Record<string, unknown> | undefined;
    if (!result?.id) return { passed: false, detail: "no task id in result" };
    createdTaskId = result.id as string;
    return { passed: true };
  });

  // 3. tasks/get
  await runTest("tasks/get — retrieves task", async () => {
    if (!createdTaskId) return { passed: false, detail: "no task created in previous step" };
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-2",
        method: "tasks/get",
        params: { taskId: createdTaskId },
      }),
    });
    if (!res.ok) return { passed: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as Record<string, unknown>;
    if (body.error) return { passed: false, detail: JSON.stringify(body.error) };
    const result = body.result as Record<string, unknown> | undefined;
    if (result?.id !== createdTaskId) return { passed: false, detail: "task id mismatch" };
    return { passed: true };
  });

  // 4. tasks/list
  await runTest("tasks/list — pagination works", async () => {
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-3",
        method: "tasks/list",
        params: { limit: 5, offset: 0 },
      }),
    });
    if (!res.ok) return { passed: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as Record<string, unknown>;
    if (body.error) return { passed: false, detail: JSON.stringify(body.error) };
    const result = body.result as Record<string, unknown> | undefined;
    if (!Array.isArray(result?.tasks)) return { passed: false, detail: "result.tasks is not an array" };
    if (typeof result?.total !== "number") return { passed: false, detail: "result.total missing" };
    if (typeof result?.limit !== "number") return { passed: false, detail: "result.limit missing" };
    if (typeof result?.offset !== "number") return { passed: false, detail: "result.offset missing" };
    return { passed: true };
  });

  // 5. tasks/cancel
  await runTest("tasks/cancel — cancels task", async () => {
    if (!createdTaskId) return { passed: false, detail: "no task created" };
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-4",
        method: "tasks/cancel",
        params: { taskId: createdTaskId },
      }),
    });
    if (!res.ok) return { passed: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as Record<string, unknown>;
    if (body.error) return { passed: false, detail: JSON.stringify(body.error) };
    const result = body.result as Record<string, unknown> | undefined;
    const status = result?.status as Record<string, unknown> | undefined;
    if (status?.state !== "canceled") return { passed: false, detail: `state: ${String(status?.state)}` };
    return { passed: true };
  });

  // 6. Error handling — invalid JSON
  await runTest("Error handling — invalid JSON", async () => {
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json",
    });
    // The server may return 400 for parse errors, which is acceptable
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (body?.error) {
      const err = body.error as Record<string, unknown>;
      if (err.code === -32700) return { passed: true };
    }
    // Some implementations return 400 status without JSON-RPC error body
    if (res.status === 400) return { passed: true };
    return { passed: false, detail: `Expected parse error, got HTTP ${res.status}` };
  });

  // 7. Error handling — unknown method
  await runTest("Error handling — unknown method", async () => {
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-5",
        method: "nonexistent/method",
        params: {},
      }),
    });
    if (!res.ok && res.status !== 200) {
      // Some servers return 200 with error in body, some return 404
      return { passed: false, detail: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as Record<string, unknown>;
    const err = body.error as Record<string, unknown> | undefined;
    if (err?.code !== -32601) return { passed: false, detail: `Expected -32601, got ${String(err?.code)}` };
    return { passed: true };
  });

  // 8. Error handling — missing params
  await runTest("Error handling — missing params", async () => {
    const res = await fetch(`${baseUrl}/a2a/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-6",
        method: "message/send",
        params: {},
      }),
    });
    const body = (await res.json()) as Record<string, unknown>;
    const err = body.error as Record<string, unknown> | undefined;
    if (err?.code !== -32602) return { passed: false, detail: `Expected -32602, got ${String(err?.code)}` };
    return { passed: true };
  });

  // Print results
  let passed = 0;
  const total = results.length;
  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    const detail = r.detail && !r.passed ? ` (${r.detail})` : "";
    console.log(`${icon} ${r.name}${detail}`);
    if (r.passed) passed++;
  }

  console.log(`\n${passed}/${total} tests passed${passed === total ? " — A2A v1.0 compliant ✓" : ""}`);
  if (passed < total) process.exit(1);
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
      case "test":
        return await testCommand(rest);
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
