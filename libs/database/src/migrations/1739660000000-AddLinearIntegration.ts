import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinearIntegration1739660000000 implements MigrationInterface {
  name = "AddLinearIntegration1739660000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "linear_connections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "org_id" uuid NOT NULL,
        "team_id" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "webhook_secret" character varying(255) NOT NULL,
        "api_key" character varying(500),
        "team_filter" jsonb NOT NULL DEFAULT '[]',
        "sync_config" jsonb NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "last_sync_at" TIMESTAMP WITH TIME ZONE,
        "last_error" character varying(1000),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_linear_connections" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_linear_connections_team_id" UNIQUE ("team_id"),
        CONSTRAINT "FK_linear_connections_org" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_linear_connections_org_enabled" ON "linear_connections" ("org_id", "enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_linear_connections_org_enabled"`);
    await queryRunner.query(`DROP TABLE "linear_connections"`);
  }
}
