#!/usr/bin/env node
/**
 * Seed script - creates org + Talent Agent
 */
import "reflect-metadata";
import { randomBytes, createCipheriv } from "node:crypto";
import { DataSource } from "typeorm";

const url = process.env.DATABASE_URL;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!url) {
  console.error("❌ DATABASE_URL required");
  process.exit(1);
}
if (!encryptionKey || encryptionKey.length !== 64) {
  console.error("❌ ENCRYPTION_KEY required (64 hex chars = 32 bytes)");
  console.error("   Generate with: openssl rand -hex 32");
  process.exit(1);
}

const orgName = process.argv[2] || "OpenSpawn";
const orgSlug = process.argv[3] || "openspawn";

// Crypto helpers
function generateSigningSecret() {
  return randomBytes(32).toString("hex");
}

function encryptSecret(plaintext, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

const ds = new DataSource({
  type: "postgres",
  url,
  logging: false,
});

console.log(`\n🌱 Seeding OpenSpawn database...\n`);
console.log(`Organization: ${orgName} (${orgSlug})`);

try {
  await ds.initialize();

  // 1. Create Organization
  const orgResult = await ds.query(
    `
    INSERT INTO organizations (name, slug, task_prefix, next_task_number, settings)
    VALUES ($1, $2, 'TASK', 1, '{}')
    RETURNING id, name
  `,
    [orgName, orgSlug],
  );
  const org = orgResult[0];
  console.log(`✅ Created organization: ${org.name} (${org.id})`);

  // 2. Generate and encrypt Talent Agent secret
  const plaintextSecret = generateSigningSecret();
  const encryptedSecret = encryptSecret(plaintextSecret, encryptionKey);

  // 3. Create Talent Agent
  const agentResult = await ds.query(
    `
    INSERT INTO agents (
      org_id, agent_id, name, level, model, status, role,
      management_fee_pct, current_balance, budget_period_spent,
      hmac_secret_enc, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, agent_id, name
  `,
    [
      org.id,
      "talent",
      "Talent Agent",
      10,
      "opus",
      "active",
      "hr",
      20,
      0,
      0,
      encryptedSecret,
      JSON.stringify({ description: "HR agent for registering and managing other agents" }),
    ],
  );
  const agent = agentResult[0];
  console.log(`✅ Created Talent Agent: ${agent.agent_id} (${agent.id})`);

  // 4. Add capabilities
  const capabilities = ["hr", "agent-management", "onboarding"];
  for (const cap of capabilities) {
    await ds.query(
      `
      INSERT INTO agent_capabilities (org_id, agent_id, capability, proficiency)
      VALUES ($1, $2, $3, $4)
    `,
      [org.id, agent.id, cap, "expert"],
    );
  }
  console.log(`✅ Added ${capabilities.length} capabilities`);

  // 5. Seed credit rate configs
  const rateConfigs = [
    ["task.done", "credit", 25, "fixed", null, "Worker earns credits for completing a task"],
    ["task.delegated", "credit", 2, "fixed", null, "Founder earns credits for delegation"],
    ["task.reviewed", "credit", 3, "fixed", null, "Reviewer earns credits for review"],
    ["task.approved", "credit", 5, "fixed", null, "Approver earns credits for approval"],
    ["mgmt_fee", "credit", null, "dynamic", null, "Management fee on task completion"],
    ["model.opus", "debit", null, "dynamic", "100.0000", "Opus API cost"],
    ["model.sonnet", "debit", null, "dynamic", "100.0000", "Sonnet API cost"],
    ["model.haiku", "debit", null, "dynamic", "100.0000", "Haiku API cost"],
    ["credits.manual", "credit", null, "fixed", null, "Manual credit adjustment"],
  ];
  for (const [trigger, dir, amt, mode, rate, desc] of rateConfigs) {
    await ds.query(
      `
      INSERT INTO credit_rate_configs (org_id, trigger_type, direction, amount, amount_mode, usd_to_credits_rate, description, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    `,
      [org.id, trigger, dir, amt, mode, rate, desc],
    );
  }
  console.log(`✅ Seeded ${rateConfigs.length} credit rate configs`);

  // 6. Create #general channel
  await ds.query(
    `
    INSERT INTO channels (org_id, name, type, metadata)
    VALUES ($1, $2, $3, $4)
  `,
    [org.id, "#general", "general", JSON.stringify({ description: "General discussion" })],
  );
  console.log(`✅ Created #general channel`);

  // 7. Emit agent.registered event
  await ds.query(
    `
    INSERT INTO events (org_id, type, actor_id, entity_type, entity_id, data, severity, reasoning)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    [
      org.id,
      "agent.registered",
      agent.id,
      "agent",
      agent.id,
      JSON.stringify({ agentId: "talent", name: "Talent Agent", role: "hr", level: 10 }),
      "info",
      "Initial seed - Talent Agent self-registration",
    ],
  );
  console.log(`✅ Emitted agent.registered event`);

  // Print secret
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔐 TALENT AGENT SECRET (save this - shown only once!):`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nAgent ID: talent`);
  console.log(`Secret:   ${plaintextSecret}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n✨ Seed completed!\n`);

  await ds.destroy();
} catch (err) {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
}
