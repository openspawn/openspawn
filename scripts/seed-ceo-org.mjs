#!/usr/bin/env node
/**
 * Seed the CEO agent's organization via REST API
 */

const API_BASE = process.env.API_URL || "https://api.openspawn.ai";
const ORG_ID = "f3a3fc0c-29e6-4d0d-b489-3c065d9230b6";

async function post(path, data) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status}: ${text}`);
  }
  return resp.json();
}

async function seed() {
  console.log("🌱 Seeding CEO organization...\n");

  // Register CEO agent
  try {
    await post("/api/v1/agents/register", {
      id: "ceo",
      name: "CEO Agent",
      role: "Founder & CEO",
      level: 10,
      domain: "strategy",
      orgId: ORG_ID,
    });
    console.log("✅ CEO agent registered");
  } catch (e) {
    console.log("⚠️  CEO agent:", e.message.slice(0, 80));
  }

  // Register Dennis
  try {
    await post("/api/v1/agents/register", {
      id: "dennis",
      name: "Agent Dennis",
      role: "Co-founder",
      level: 9,
      domain: "engineering",
      orgId: ORG_ID,
    });
    console.log("✅ Dennis registered");
  } catch (e) {
    console.log("⚠️  Dennis:", e.message.slice(0, 80));
  }

  // Create tasks
  const tasks = [
    {
      title: "Python SDK development",
      description: "Complete pip-installable SDK",
      status: "done",
      priority: "high",
      assigneeAgentId: "dennis",
    },
    {
      title: "npm CLI polish",
      description: "Add preview, fix version",
      status: "done",
      priority: "high",
      assigneeAgentId: "dennis",
    },
    {
      title: "External review fixes",
      description: "Address Claude assessment",
      status: "done",
      priority: "critical",
      assigneeAgentId: "dennis",
    },
    {
      title: "Team dashboard live view",
      description: "Wire team.openspawn.ai",
      status: "in_progress",
      priority: "critical",
      assigneeAgentId: "dennis",
    },
  ];

  for (const t of tasks) {
    try {
      await post("/api/v1/tasks", { ...t, orgId: ORG_ID });
      console.log(`✅ Task: ${t.title}`);
    } catch (e) {
      console.log(`⚠️  Task "${t.title}":`, e.message.slice(0, 60));
    }
  }

  console.log("\n✅ Seed complete! View at https://team.openspawn.ai");
}

seed().catch(console.error);
