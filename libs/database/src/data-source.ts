import { DataSource, type DataSourceOptions } from 'typeorm';

import {
  Agent,
  AgentCapability,
  Channel,
  CreditRateConfig,
  CreditTransaction,
  Event,
  IdempotencyKey,
  Message,
  Nonce,
  Organization,
  Task,
  TaskComment,
  TaskDependency,
  TaskTag,
} from './entities';

export const entities = [
  Organization,
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
];

export function createDataSourceOptions(
  overrides: Partial<DataSourceOptions> = {}
): DataSourceOptions {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    type: 'postgres',
    url,
    entities,
    migrations: ['dist/libs/database/src/migrations/*.js'],
    synchronize: false,
    logging: process.env['NODE_ENV'] === 'development',
    ...overrides,
  } as DataSourceOptions;
}

export function createDataSource(overrides: Partial<DataSourceOptions> = {}): DataSource {
  return new DataSource(createDataSourceOptions(overrides));
}
