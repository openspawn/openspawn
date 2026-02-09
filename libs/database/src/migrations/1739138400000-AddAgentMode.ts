import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgentMode1739138400000 implements MigrationInterface {
  name = "AddAgentMode1739138400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add mode column with default value 'worker'
    await queryRunner.query(`
      ALTER TABLE "agents"
      ADD COLUMN "mode" VARCHAR(20) NOT NULL DEFAULT 'worker'
    `);

    // Add index for mode filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_agents_org_mode" ON "agents" ("org_id", "mode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_agents_org_mode"`);
    await queryRunner.query(`ALTER TABLE "agents" DROP COLUMN "mode"`);
  }
}
