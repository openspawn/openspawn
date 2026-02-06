#!/usr/bin/env node
/**
 * Standalone DB sync script (no workspace imports)
 */
import "reflect-metadata";
import { DataSource } from "typeorm";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

// Inline entity definitions for sync only
const ds = new DataSource({
  type: "postgres",
  url,
  synchronize: true,
  logging: true,
  entities: [], // Empty - will use schema:sync to discover
});

console.log("🔄 Connecting to database...");

try {
  await ds.initialize();

  // Run raw SQL to create tables based on our schema
  await ds.query(`
    -- Organizations
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      task_prefix VARCHAR(20) DEFAULT 'TASK',
      next_task_number INT DEFAULT 1,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Agents
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      agent_id VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      level SMALLINT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
      model VARCHAR(100) NOT NULL DEFAULT 'sonnet',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      role VARCHAR(50) NOT NULL DEFAULT 'worker',
      management_fee_pct SMALLINT NOT NULL DEFAULT 0 CHECK (management_fee_pct >= 0 AND management_fee_pct <= 50),
      current_balance INT NOT NULL DEFAULT 0,
      budget_period_limit INT,
      budget_period_spent INT NOT NULL DEFAULT 0,
      budget_period_start TIMESTAMPTZ,
      hmac_secret_enc BYTEA NOT NULL,
      metadata JSONB DEFAULT '{}',
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(org_id, agent_id)
    );

    -- Agent Capabilities
    CREATE TABLE IF NOT EXISTS agent_capabilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      agent_id UUID NOT NULL REFERENCES agents(id),
      capability VARCHAR(100) NOT NULL,
      proficiency VARCHAR(20) DEFAULT 'standard',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(agent_id, capability)
    );

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      identifier VARCHAR(20) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'backlog',
      priority VARCHAR(10) NOT NULL DEFAULT 'normal',
      assignee_id UUID REFERENCES agents(id),
      creator_id UUID NOT NULL REFERENCES agents(id),
      parent_task_id UUID REFERENCES tasks(id),
      approval_required BOOLEAN NOT NULL DEFAULT false,
      approved_by VARCHAR(255),
      approved_at TIMESTAMPTZ,
      due_date TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}',
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(org_id, identifier)
    );

    -- Task Dependencies
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      task_id UUID NOT NULL REFERENCES tasks(id),
      depends_on_id UUID NOT NULL REFERENCES tasks(id),
      blocking BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(task_id, depends_on_id)
    );

    -- Task Tags
    CREATE TABLE IF NOT EXISTS task_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      task_id UUID NOT NULL REFERENCES tasks(id),
      tag VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(task_id, tag)
    );

    -- Task Comments
    CREATE TABLE IF NOT EXISTS task_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      task_id UUID NOT NULL REFERENCES tasks(id),
      author_id UUID NOT NULL REFERENCES agents(id),
      body TEXT NOT NULL,
      parent_comment_id UUID REFERENCES task_comments(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Credit Transactions
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      agent_id UUID NOT NULL REFERENCES agents(id),
      type VARCHAR(10) NOT NULL,
      amount INT NOT NULL CHECK (amount > 0),
      balance_after INT NOT NULL,
      reason VARCHAR(500) NOT NULL,
      trigger_type VARCHAR(100),
      trigger_event_id UUID,
      source_task_id UUID REFERENCES tasks(id),
      source_agent_id UUID REFERENCES agents(id),
      litellm_cost_usd NUMERIC(10,6),
      idempotency_key UUID UNIQUE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Credit Rate Configs
    CREATE TABLE IF NOT EXISTS credit_rate_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      trigger_type VARCHAR(100) NOT NULL,
      direction VARCHAR(10) NOT NULL,
      amount INT,
      amount_mode VARCHAR(20) NOT NULL DEFAULT 'fixed',
      usd_to_credits_rate NUMERIC(10,4),
      description VARCHAR(255),
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(org_id, trigger_type, direction)
    );

    -- Channels
    CREATE TABLE IF NOT EXISTS channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      task_id UUID REFERENCES tasks(id),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(org_id, name)
    );

    -- Messages
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      channel_id UUID NOT NULL REFERENCES channels(id),
      sender_id UUID NOT NULL REFERENCES agents(id),
      type VARCHAR(20) NOT NULL DEFAULT 'text',
      body TEXT NOT NULL,
      parent_message_id UUID REFERENCES messages(id),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Events
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id),
      type VARCHAR(100) NOT NULL,
      actor_id UUID NOT NULL REFERENCES agents(id),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      data JSONB NOT NULL,
      severity VARCHAR(10) NOT NULL DEFAULT 'info',
      reasoning VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Idempotency Keys
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key UUID NOT NULL UNIQUE,
      org_id UUID NOT NULL REFERENCES organizations(id),
      agent_id UUID NOT NULL REFERENCES agents(id),
      method VARCHAR(10) NOT NULL,
      path VARCHAR(500) NOT NULL,
      status_code SMALLINT NOT NULL,
      response_body JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Nonces
    CREATE TABLE IF NOT EXISTS nonces (
      nonce VARCHAR(64) PRIMARY KEY,
      agent_id UUID NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Add FK for credit_transactions.trigger_event_id after events table exists
    DO $$ BEGIN
      ALTER TABLE credit_transactions 
        ADD CONSTRAINT fk_trigger_event 
        FOREIGN KEY (trigger_event_id) REFERENCES events(id);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  console.log("✅ Schema created successfully!");
  await ds.destroy();
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exit(1);
}
