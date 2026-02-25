import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInboundWebhookKeys1739487600000 implements MigrationInterface {
  name = "AddInboundWebhookKeys1739487600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inbound_webhook_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "org_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "key" character varying(64) NOT NULL,
        "secret" character varying(64) NOT NULL,
        "default_agent_id" uuid,
        "default_priority" character varying(10),
        "default_tags" text NOT NULL DEFAULT '',
        "enabled" boolean NOT NULL DEFAULT true,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inbound_webhook_keys" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_inbound_webhook_keys_key" UNIQUE ("key"),
        CONSTRAINT "FK_inbound_webhook_keys_org" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inbound_webhook_keys_key" ON "inbound_webhook_keys" ("key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inbound_webhook_keys_org_enabled" ON "inbound_webhook_keys" ("org_id", "enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_inbound_webhook_keys_org_enabled"`);
    await queryRunner.query(`DROP INDEX "IDX_inbound_webhook_keys_key"`);
    await queryRunner.query(`DROP TABLE "inbound_webhook_keys"`);
  }
}
