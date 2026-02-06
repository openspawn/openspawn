/**
 * CLI DataSource for TypeORM migrations
 *
 * Usage:
 *   npx typeorm migration:generate -d libs/database/src/data-source.cli.ts src/migrations/Init
 *   npx typeorm migration:run -d libs/database/src/data-source.cli.ts
 *   npx typeorm migration:revert -d libs/database/src/data-source.cli.ts
 *
 * Note: Requires DATABASE_URL environment variable to be set.
 * You can use: `source .env && npx typeorm ...` or set it directly.
 */

import { DataSource } from "typeorm";

import { createDataSourceOptions } from "./data-source";

export default new DataSource(
  createDataSourceOptions({
    migrations: ["libs/database/src/migrations/*.ts"],
  }),
);
