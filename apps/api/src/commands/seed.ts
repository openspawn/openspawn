#!/usr/bin/env npx tsx
/**
 * Seed Command
 *
 * Creates the initial organization and Talent Agent.
 *
 * Usage:
 *   DATABASE_URL=... ENCRYPTION_KEY=... npx tsx apps/api/src/commands/seed.ts [org-name] [org-slug]
 *
 * Example:
 *   DATABASE_URL=postgresql://... ENCRYPTION_KEY=... npx tsx apps/api/src/commands/seed.ts "OpenSpawn" "openspawn"
 */

import { DataSource } from "typeorm";

import {
  Agent,
  AgentCapability,
  Channel,
  CreditRateConfig,
  Event,
  Organization,
  createDataSourceOptions,
} from "@openspawn/database";
import {
  AgentRole,
  AgentStatus,
  AmountMode,
  ChannelType,
  CreditType,
  EventSeverity,
  Proficiency,
  encryptSecret,
  generateSigningSecret,
} from "@openspawn/shared-types";

async function seed() {
  const orgName = process.argv[2] || "OpenSpawn";
  const orgSlug = process.argv[3] || "openspawn";

  const encryptionKey = process.env["ENCRYPTION_KEY"];
  if (!encryptionKey) {
    console.error("Error: ENCRYPTION_KEY environment variable is required");
    console.error("Generate one with: openssl rand -hex 32");
    process.exit(1);
  }

  console.log(`\n🌱 Seeding OpenSpawn database...\n`);
  console.log(`Organization: ${orgName} (${orgSlug})`);

  const dataSource = new DataSource(createDataSourceOptions());
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      // 1. Create Organization
      const org = manager.create(Organization, {
        name: orgName,
        slug: orgSlug,
        taskPrefix: "TASK",
        nextTaskNumber: 1,
        settings: {},
      });
      await manager.save(org);
      console.log(`✅ Created organization: ${org.name} (${org.id})`);

      // 2. Generate and encrypt Talent Agent secret
      const plaintextSecret = generateSigningSecret();
      const encryptedSecret = encryptSecret(plaintextSecret, encryptionKey);

      // 3. Create Talent Agent (HR role, level 10, opus model)
      const talentAgent = manager.create(Agent, {
        orgId: org.id,
        agentId: "talent",
        name: "Talent Agent",
        level: 10,
        model: "opus",
        status: AgentStatus.ACTIVE,
        role: AgentRole.HR,
        managementFeePct: 20,
        currentBalance: 0,
        budgetPeriodSpent: 0,
        hmacSecretEnc: encryptedSecret,
        metadata: {
          description: "HR agent responsible for registering and managing other agents",
        },
      });
      await manager.save(talentAgent);
      console.log(`✅ Created Talent Agent: ${talentAgent.agentId} (${talentAgent.id})`);

      // 4. Add default capabilities for Talent Agent
      const capabilities = ["hr", "agent-management", "onboarding"].map((cap) =>
        manager.create(AgentCapability, {
          orgId: org.id,
          agentId: talentAgent.id,
          capability: cap,
          proficiency: Proficiency.EXPERT,
        }),
      );
      await manager.save(capabilities);
      console.log(`✅ Added ${capabilities.length} capabilities to Talent Agent`);

      // 5. Seed default credit rate configs
      const rateConfigs = [
        {
          triggerType: "task.done",
          direction: CreditType.CREDIT,
          amount: 25,
          amountMode: AmountMode.FIXED,
          description: "Worker earns credits for completing a task",
        },
        {
          triggerType: "task.delegated",
          direction: CreditType.CREDIT,
          amount: 2,
          amountMode: AmountMode.FIXED,
          description: "Founder earns credits for creating & assigning a task",
        },
        {
          triggerType: "task.reviewed",
          direction: CreditType.CREDIT,
          amount: 3,
          amountMode: AmountMode.FIXED,
          description: "Reviewer earns credits for quality gate actions",
        },
        {
          triggerType: "task.approved",
          direction: CreditType.CREDIT,
          amount: 5,
          amountMode: AmountMode.FIXED,
          description: "Approver earns credits for approval decisions",
        },
        {
          triggerType: "mgmt_fee",
          direction: CreditType.CREDIT,
          amount: null,
          amountMode: AmountMode.DYNAMIC,
          description: "Founder earns % of task completion credits",
        },
        {
          triggerType: "model.opus",
          direction: CreditType.DEBIT,
          amount: null,
          amountMode: AmountMode.DYNAMIC,
          usdToCreditsRate: "100.0000",
          description: "Opus API cost from LiteLLM",
        },
        {
          triggerType: "model.sonnet",
          direction: CreditType.DEBIT,
          amount: null,
          amountMode: AmountMode.DYNAMIC,
          usdToCreditsRate: "100.0000",
          description: "Sonnet API cost from LiteLLM",
        },
        {
          triggerType: "model.haiku",
          direction: CreditType.DEBIT,
          amount: null,
          amountMode: AmountMode.DYNAMIC,
          usdToCreditsRate: "100.0000",
          description: "Haiku API cost from LiteLLM",
        },
        {
          triggerType: "credits.manual",
          direction: CreditType.CREDIT,
          amount: null,
          amountMode: AmountMode.FIXED,
          description: "Manual credit adjustment by admin",
        },
      ].map((config) =>
        manager.create(CreditRateConfig, {
          orgId: org.id,
          ...config,
          active: true,
        }),
      );
      await manager.save(rateConfigs);
      console.log(`✅ Seeded ${rateConfigs.length} credit rate configurations`);

      // 6. Create #general channel
      const generalChannel = manager.create(Channel, {
        orgId: org.id,
        name: "#general",
        type: ChannelType.GENERAL,
        metadata: { description: "General discussion channel" },
      });
      await manager.save(generalChannel);
      console.log(`✅ Created #general channel`);

      // 7. Emit agent.registered event
      const event = manager.create(Event, {
        orgId: org.id,
        type: "agent.registered",
        actorId: talentAgent.id,
        entityType: "agent",
        entityId: talentAgent.id,
        data: {
          agentId: talentAgent.agentId,
          name: talentAgent.name,
          role: talentAgent.role,
          level: talentAgent.level,
        },
        severity: EventSeverity.INFO,
        reasoning: "Initial seed - Talent Agent self-registration",
      });
      await manager.save(event);
      console.log(`✅ Emitted agent.registered event`);

      // Print the secret ONCE
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔐 TALENT AGENT SECRET (save this - shown only once!):`);
      console.log(`${"=".repeat(60)}`);
      console.log(`\nAgent ID: talent`);
      console.log(`Secret:   ${plaintextSecret}`);
      console.log(`\n${"=".repeat(60)}`);
      console.log(`\nUse these credentials to authenticate as the Talent Agent.`);
      console.log(`The secret is encrypted in the database and cannot be recovered.\n`);
    });

    console.log(`\n✨ Seed completed successfully!\n`);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
