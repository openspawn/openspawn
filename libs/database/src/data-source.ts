import { DataSource, type DataSourceOptions } from "typeorm";

import {
  Agent,
  AgentCapability,
  ApiKey,
  Channel,
  ConsensusRequest,
  ConsensusVote,
  CreditRateConfig,
  CreditTransaction,
  Escalation,
  Event,
  IdempotencyKey,
  Message,
  Nonce,
  Organization,
  RefreshToken,
  ReputationEvent,
  Task,
  TaskComment,
  TaskDependency,
  TaskTag,
  User,
  Webhook,
} from "./entities";

export const entities = [
  Organization,
  User,
  RefreshToken,
  ApiKey,
  Agent,
  AgentCapability,
  Task,
  TaskDependency,
  TaskTag,
  TaskComment,
  CreditTransaction,
  CreditRateConfig,
  Channel,
  Message,
  Event,
  IdempotencyKey,
  Nonce,
  ReputationEvent,
  Escalation,
  ConsensusRequest,
  ConsensusVote,
  Webhook,
];

export function createDataSourceOptions(
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return {
    type: "postgres",
    url,
    entities,
    migrations: ["dist/libs/database/src/migrations/*.js"],
    synchronize: false,
    logging: process.env["NODE_ENV"] === "development",
    ...overrides,
  } as DataSourceOptions;
}

export function createDataSource(overrides: Partial<DataSourceOptions> = {}): DataSource {
  return new DataSource(createDataSourceOptions(overrides));
}
