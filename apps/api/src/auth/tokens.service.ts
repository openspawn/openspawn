import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { createHash, randomBytes } from "crypto";

import { RefreshToken, User } from "@openspawn/database";

export interface AccessTokenPayload {
  sub: string; // user.id
  org: string; // org.id
  role: string; // admin | operator | viewer
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; // user.id
  jti: string; // refresh_token.id
  type: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokensService {
  private readonly ACCESS_TOKEN_EXPIRES = "15m";
  private readonly REFRESH_TOKEN_EXPIRES_DAYS = 7;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async generateTokenPair(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    // Generate access token
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      org: user.orgId,
      role: user.role,
      type: "access",
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES,
    });

    // Generate refresh token
    const refreshTokenValue = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(refreshTokenValue);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Create refresh JWT (contains the ID to lookup the token)
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshTokenEntity.id,
      type: "refresh",
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: `${this.REFRESH_TOKEN_EXPIRES_DAYS}d`,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      // Lookup the refresh token
      const tokenEntity = await this.refreshTokenRepository.findOne({
        where: { id: payload.jti },
        relations: ["user"],
      });

      if (!tokenEntity) {
        throw new UnauthorizedException("Refresh token not found");
      }

      if (tokenEntity.revokedAt) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      if (tokenEntity.expiresAt < new Date()) {
        throw new UnauthorizedException("Refresh token has expired");
      }

      // Rotate: revoke old token, issue new pair
      await this.refreshTokenRepository.update(tokenEntity.id, {
        revokedAt: new Date(),
      });

      return this.generateTokenPair(
        tokenEntity.user,
        tokenEntity.userAgent ?? undefined,
        tokenEntity.ipAddress ?? undefined,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, {
      revokedAt: new Date(),
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.jwtService.verify<AccessTokenPayload>(token);
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }
    return payload;
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
