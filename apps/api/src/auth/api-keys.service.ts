import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { randomBytes, createHash } from "node:crypto";
import { ApiKey, ApiKeyScope } from "@openspawn/database";

export interface CreateApiKeyDto {
  name: string;
  scopes?: ApiKeyScope[];
  expiresInDays?: number;
}

export interface ApiKeyWithSecret {
  id: string;
  name: string;
  keyPrefix: string;
  secretKey: string; // Only returned once at creation
  scopes: ApiKeyScope[];
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  private readonly KEY_PREFIX = "osp_";

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>
  ) {}

  /**
   * Generate a new API key for a user
   */
  async create(
    userId: string,
    orgId: string,
    dto: CreateApiKeyDto
  ): Promise<ApiKeyWithSecret> {
    // Generate random key: osp_<32 random bytes as hex>
    const randomPart = randomBytes(32).toString("hex");
    const secretKey = `${this.KEY_PREFIX}${randomPart}`;
    const keyPrefix = `${this.KEY_PREFIX}${randomPart.slice(0, 8)}`;
    const keyHash = this.hashKey(secretKey);

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = this.apiKeyRepo.create({
      userId,
      orgId,
      name: dto.name,
      keyPrefix,
      keyHash,
      scopes: dto.scopes || [ApiKeyScope.READ],
      expiresAt,
    });

    const saved = await this.apiKeyRepo.save(apiKey);

    return {
      id: saved.id,
      name: saved.name,
      keyPrefix: saved.keyPrefix,
      secretKey, // Only returned here, never again!
      scopes: saved.scopes,
      expiresAt: saved.expiresAt,
      createdAt: saved.createdAt,
    };
  }

  /**
   * List all non-revoked API keys for a user
   */
  async findAllForUser(userId: string, orgId: string): Promise<ApiKeyResponse[]> {
    const keys = await this.apiKeyRepo.find({
      where: {
        userId,
        orgId,
        revokedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    return keys.map(this.toResponse);
  }

  /**
   * Get a single API key (must belong to user)
   */
  async findOne(id: string, userId: string, orgId: string): Promise<ApiKeyResponse> {
    const key = await this.apiKeyRepo.findOne({
      where: { id, userId, orgId, revokedAt: IsNull() },
    });

    if (!key) {
      throw new NotFoundException("API key not found");
    }

    return this.toResponse(key);
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string, userId: string, orgId: string): Promise<void> {
    const key = await this.apiKeyRepo.findOne({
      where: { id, userId, orgId, revokedAt: IsNull() },
    });

    if (!key) {
      throw new NotFoundException("API key not found");
    }

    key.revokedAt = new Date();
    await this.apiKeyRepo.save(key);
  }

  /**
   * Validate an API key and return user info
   * Used by API key auth guard
   */
  async validateKey(
    secretKey: string
  ): Promise<{ userId: string; orgId: string; scopes: ApiKeyScope[] } | null> {
    if (!secretKey.startsWith(this.KEY_PREFIX)) {
      return null;
    }

    const keyHash = this.hashKey(secretKey);
    const key = await this.apiKeyRepo.findOne({
      where: { keyHash, revokedAt: IsNull() },
    });

    if (!key) {
      return null;
    }

    // Check expiration
    if (key.expiresAt && key.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp (async, don't wait)
    this.apiKeyRepo.update(key.id, { lastUsedAt: new Date() }).catch(() => {
      // Ignore errors updating last used
    });

    return {
      userId: key.userId,
      orgId: key.orgId,
      scopes: key.scopes,
    };
  }

  /**
   * Check if scopes include required scope
   */
  hasScope(userScopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
    // Admin has all scopes
    if (userScopes.includes(ApiKeyScope.ADMIN)) {
      return true;
    }
    // Write includes read
    if (requiredScope === ApiKeyScope.READ && userScopes.includes(ApiKeyScope.WRITE)) {
      return true;
    }
    return userScopes.includes(requiredScope);
  }

  private hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  private toResponse(key: ApiKey): ApiKeyResponse {
    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  }
}
