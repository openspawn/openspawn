import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Organization } from "@openspawn/database";

@Injectable()
export class TaskIdentifierService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  /**
   * Generate the next task identifier for an organization
   * Atomically increments next_task_number
   */
  async generateIdentifier(orgId: string): Promise<string> {
    // Atomic increment using raw query
    const result = await this.orgRepository
      .createQueryBuilder()
      .update(Organization)
      .set({
        nextTaskNumber: () => "next_task_number + 1",
      })
      .where("id = :orgId", { orgId })
      .returning(["task_prefix", "next_task_number"])
      .execute();

    const updated = result.raw[0] as { task_prefix: string; next_task_number: number };

    // Format: PREFIX-NUMBER (e.g., TASK-42)
    return `${updated.task_prefix}-${updated.next_task_number}`;
  }
}
