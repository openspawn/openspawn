import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent, Nonce } from "@openspawn/database";
import {
  AgentStatus,
  computeSignature,
  decryptSecret,
  secureCompare,
} from "@openspawn/shared-types";

import type { AgentMode } from "@openspawn/shared-types";

export interface AuthenticatedAgent {
  id: string;
  orgId: string;
  agentId: string;
  name: string;
  role: string;
  mode: AgentMode;
  level: number;
}

@Injectable()
export class AuthService {
  private readonly TIMESTAMP_TOLERANCE_SECONDS = 300; // ±5 minutes

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Nonce)
    private readonly nonceRepository: Repository<Nonce>,
  ) {}

  async validateRequest(
    agentId: string,
    timestamp: string,
    nonce: string,
    signature: string,
    method: string,
    path: string,
    body: string,
  ): Promise<AuthenticatedAgent> {
    // 1. Validate timestamp is within tolerance
    const requestTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - requestTime) > this.TIMESTAMP_TOLERANCE_SECONDS) {
      throw new UnauthorizedException("Request timestamp outside valid window");
    }

    // 2. Lookup agent by agent_id
    const agent = await this.agentRepository.findOne({
      where: { agentId },
    });

    if (!agent) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new UnauthorizedException("Agent is not active");
    }

    // 3. Decrypt secret and compute expected signature
    const encryptionKey = process.env["ENCRYPTION_KEY"];
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    const plaintextSecret = decryptSecret(agent.hmacSecretEnc, encryptionKey);

    // Message format: method + path + timestamp + nonce + body
    const message = `${method}${path}${timestamp}${nonce}${body}`;
    const expectedSignature = computeSignature(plaintextSecret, message);

    // 4. Constant-time compare signatures
    if (!secureCompare(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 5. Check and insert nonce to prevent replay attacks
    const nonceExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    try {
      await this.nonceRepository.insert({
        nonce,
        agentId: agent.id,
        expiresAt: nonceExpiry,
      });
    } catch (error: unknown) {
      // Unique constraint violation = replay attack
      if ((error as { code?: string }).code === "23505") {
        throw new UnauthorizedException("Nonce already used");
      }
      throw error;
    }

    // 6. Return authenticated agent info
    return {
      id: agent.id,
      orgId: agent.orgId,
      agentId: agent.agentId,
      name: agent.name,
      role: agent.role,
      mode: agent.mode,
      level: agent.level,
    };
  }
}
