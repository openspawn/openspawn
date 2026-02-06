#!/usr/bin/env node
/**
 * Sync Schema (Development Only)
 *
 * Synchronizes TypeORM entities with the database schema.
 * DO NOT use in production - use migrations instead.
 *
 * Usage:
 *   DATABASE_URL=... node --import @swc-node/register/esm-register apps/api/src/commands/sync-schema.ts
 */

import { DataSource } from "typeorm";

// Direct import from built lib
import { createDataSourceOptions } from "../../../../libs/database/src/data-source";

async function syncSchema() {
  console.log("\n⚠️  Syncing database schema (development only)...\n");

  const dataSource = new DataSource({
    ...createDataSourceOptions(),
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Schema synchronized successfully!\n");
  } catch (error) {
    console.error("❌ Schema sync failed:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

syncSchema();
