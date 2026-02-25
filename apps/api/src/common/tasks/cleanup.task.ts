import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import { IdempotencyKey, Nonce } from "@openspawn/database";

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(
    @InjectRepository(Nonce)
    private readonly nonceRepository: Repository<Nonce>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCleanup() {
    const now = new Date();

    // Clean up expired nonces
    const nonceResult = await this.nonceRepository.delete({
      expiresAt: LessThan(now),
    });

    // Clean up expired idempotency keys
    const idempotencyResult = await this.idempotencyKeyRepository.delete({
      expiresAt: LessThan(now),
    });

    if (nonceResult.affected || idempotencyResult.affected) {
      this.logger.log(
        `Cleanup: removed ${nonceResult.affected || 0} nonces, ${idempotencyResult.affected || 0} idempotency keys`,
      );
    }
  }
}
