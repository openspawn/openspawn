import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GqlContextType } from "@nestjs/graphql";
import { Repository } from "typeorm";

import type { Request, Response } from "express";
import { Observable, of, tap } from "rxjs";

import { IdempotencyKey } from "@openspawn/database";

const IDEMPOTENCY_TTL_HOURS = 24;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    // Skip for GraphQL - mutations should handle idempotency differently
    if (context.getType<GqlContextType>() === "graphql") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Safety check
    if (!request || !response) {
      return next.handle();
    }

    // Only apply to mutation methods
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return next.handle();
    }

    // Check for idempotency key header
    const idempotencyKey = request.headers["x-idempotency-key"] as string | undefined;
    if (!idempotencyKey) {
      return next.handle();
    }

    // Check if key exists and is still valid
    const existing = await this.idempotencyKeyRepository.findOne({
      where: { key: idempotencyKey },
    });

    if (existing && existing.expiresAt > new Date()) {
      // Return cached response
      response.status(existing.statusCode);
      return of(existing.responseBody);
    }

    // Process request and cache response
    return next.handle().pipe(
      tap(async (responseBody) => {
        const agent = request.agent;
        if (!agent) return;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

        try {
          const idempotencyRecord = this.idempotencyKeyRepository.create({
            key: idempotencyKey,
            orgId: agent.orgId,
            agentId: agent.id,
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            responseBody: responseBody as Record<string, unknown>,
            expiresAt,
          });
          await this.idempotencyKeyRepository.save(idempotencyRecord);
        } catch {
          // Ignore errors - idempotency is best-effort
        }
      }),
    );
  }
}
