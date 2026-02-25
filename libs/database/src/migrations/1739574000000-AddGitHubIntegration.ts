import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGitHubIntegration1739574000000 implements MigrationInterface {
  name = "AddGitHubIntegration1739574000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "github_connections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "org_id" uuid NOT NULL,
        "installation_id" bigint NOT NULL,
        "name" character varying(255) NOT NULL,
        "webhook_secret" character varying(255) NOT NULL,
        "access_token" character varying(500),
        "repo_filter" jsonb NOT NULL DEFAULT '[]',
        "sync_config" jsonb NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "last_sync_at" TIMESTAMP WITH TIME ZONE,
        "last_error" character varying(1000),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_github_connections" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_github_connections_installation_id" UNIQUE ("installation_id"),
        CONSTRAINT "FK_github_connections_org" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_github_connections_org_enabled" ON "github_connections" ("org_id", "enabled")
    `);

    await queryRunner.query(`
      CREATE TABLE "integration_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "org_id" uuid NOT NULL,
        "provider" character varying(50) NOT NULL DEFAULT 'github',
        "source_type" character varying(50) NOT NULL,
        "source_id" character varying(255) NOT NULL,
        "target_type" character varying(50) NOT NULL,
        "target_id" uuid NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_integration_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_integration_links_org" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_integration_links_source" ON "integration_links" ("org_id", "source_type", "source_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_integration_links_target" ON "integration_links" ("org_id", "target_type", "target_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_integration_links_provider" ON "integration_links" ("org_id", "provider")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_integration_links_provider"`);
    await queryRunner.query(`DROP INDEX "IDX_integration_links_target"`);
    await queryRunner.query(`DROP INDEX "IDX_integration_links_source"`);
    await queryRunner.query(`DROP TABLE "integration_links"`);
    await queryRunner.query(`DROP INDEX "IDX_github_connections_org_enabled"`);
    await queryRunner.query(`DROP TABLE "github_connections"`);
  }
}
