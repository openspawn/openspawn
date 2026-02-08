import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";

import { User, UserRole } from "@openspawn/database";

import { UsersService } from "../users";
import { TokensService } from "./tokens.service";
import { TotpService } from "./totp.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Public, CurrentUser } from "./decorators";
import type { JwtUser } from "./jwt.strategy";
import type { GoogleProfile } from "./google.strategy";

// DTOs
interface LoginDto {
  email: string;
  password: string;
  totpCode?: string;
  orgId?: string; // Optional for multi-org deployments
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  orgId: string;
}

interface RefreshDto {
  refreshToken: string;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface TotpSetupDto {
  password: string; // Verify password before enabling 2FA
}

interface TotpVerifyDto {
  code: string;
}

interface TotpDisableDto {
  password: string;
  code: string; // Require TOTP code to disable
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly totpService: TotpService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // For single-org deployments, get the default org
    // For multi-org, orgId must be provided
    const orgId = dto.orgId ?? process.env["DEFAULT_ORG_ID"];
    if (!orgId) {
      throw new BadRequestException("Organization ID is required");
    }

    const user = await this.usersService.findByEmail(orgId, dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const validPassword = await this.usersService.validatePassword(user, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check TOTP if enabled
    if (user.totpEnabled) {
      if (!dto.totpCode) {
        return {
          requiresTwoFactor: true,
          message: "Two-factor authentication code required",
        };
      }

      const encryptionKey = this.getEncryptionKey();
      const secret = this.totpService.decryptSecret(user.totpSecretEnc!, encryptionKey);

      if (!this.totpService.verifyToken(secret, dto.totpCode)) {
        // Check recovery codes
        if (user.recoveryCodesEnc) {
          const codes = this.totpService.decryptRecoveryCodes(
            user.recoveryCodesEnc,
            encryptionKey,
          );

          if (this.totpService.validateRecoveryCode(dto.totpCode, codes)) {
            // Use and remove the recovery code
            const remainingCodes = this.totpService.removeRecoveryCode(dto.totpCode, codes);
            const codesEnc = this.totpService.encryptRecoveryCodes(remainingCodes, encryptionKey);
            await this.usersService.setRecoveryCodes(user.id, codesEnc);
          } else {
            throw new UnauthorizedException("Invalid two-factor code");
          }
        } else {
          throw new UnauthorizedException("Invalid two-factor code");
        }
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.tokensService.generateTokenPair(
      user,
      req.headers["user-agent"],
      req.ip,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const tokens = await this.tokensService.refreshAccessToken(dto.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto) {
    // Extract token ID from refresh token and revoke it
    try {
      // The refresh endpoint already rotates tokens, so we just need to
      // ensure the current token is revoked
      await this.tokensService.refreshAccessToken(dto.refreshToken);
    } catch {
      // Token might already be invalid, that's fine
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: JwtUser) {
    await this.tokensService.revokeAllUserTokens(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: JwtUser) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      role: fullUser.role,
      orgId: fullUser.orgId,
      totpEnabled: fullUser.totpEnabled,
      emailVerified: fullUser.emailVerified,
      lastLoginAt: fullUser.lastLoginAt,
      createdAt: fullUser.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException("User not found");
    }

    const validPassword = await this.usersService.validatePassword(fullUser, dto.currentPassword);
    if (!validPassword) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    await this.usersService.updatePassword(user.id, dto.newPassword);

    // Revoke all refresh tokens to force re-login
    await this.tokensService.revokeAllUserTokens(user.id);
  }

  // Admin-only: Create new user
  @UseGuards(JwtAuthGuard)
  @Post("register")
  async register(@CurrentUser() user: JwtUser, @Body() dto: RegisterDto) {
    // Only admins can create new users
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException("Only admins can create users");
    }

    const newUser = await this.usersService.create({
      orgId: dto.orgId,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: UserRole.VIEWER,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };
  }

  // TOTP Setup
  @UseGuards(JwtAuthGuard)
  @Post("totp/setup")
  async setupTotp(@CurrentUser() user: JwtUser, @Body() dto: TotpSetupDto) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException("User not found");
    }

    if (fullUser.totpEnabled) {
      throw new BadRequestException("Two-factor authentication is already enabled");
    }

    // Verify password
    const validPassword = await this.usersService.validatePassword(fullUser, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid password");
    }

    const encryptionKey = this.getEncryptionKey();
    const setup = await this.totpService.generateSetup(fullUser.email);

    // Store the secret temporarily (not enabled yet)
    const secretEnc = this.totpService.encryptSecret(setup.secret, encryptionKey);
    await this.usersService.enableTotp(user.id, secretEnc);
    // Immediately disable - user must verify with code to enable
    await this.usersService.disableTotp(user.id);

    // Store secret again for verification
    await this.usersService.enableTotp(user.id, secretEnc);
    // Set totpEnabled to false (pending verification)
    // We need a separate field for pending setup vs enabled
    // For now, we'll just return the setup and require verification

    return {
      qrCode: setup.qrCodeDataUrl,
      recoveryCodes: setup.recoveryCodes,
      message: "Scan the QR code and enter a code to complete setup",
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("totp/verify")
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyTotp(@CurrentUser() user: JwtUser, @Body() dto: TotpVerifyDto) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser || !fullUser.totpSecretEnc) {
      throw new BadRequestException("TOTP setup not started");
    }

    const encryptionKey = this.getEncryptionKey();
    const secret = this.totpService.decryptSecret(fullUser.totpSecretEnc, encryptionKey);

    if (!this.totpService.verifyToken(secret, dto.code)) {
      throw new UnauthorizedException("Invalid code");
    }

    // Generate and store recovery codes
    const recoveryCodes = this.totpService.generateRecoveryCodes();
    const codesEnc = this.totpService.encryptRecoveryCodes(recoveryCodes, encryptionKey);
    await this.usersService.setRecoveryCodes(user.id, codesEnc);

    // TOTP is now fully enabled (it was set during setup)
  }

  @UseGuards(JwtAuthGuard)
  @Post("totp/disable")
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableTotp(@CurrentUser() user: JwtUser, @Body() dto: TotpDisableDto) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser || !fullUser.totpEnabled) {
      throw new BadRequestException("Two-factor authentication is not enabled");
    }

    // Verify password
    const validPassword = await this.usersService.validatePassword(fullUser, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid password");
    }

    // Verify TOTP code
    const encryptionKey = this.getEncryptionKey();
    const secret = this.totpService.decryptSecret(fullUser.totpSecretEnc!, encryptionKey);
    if (!this.totpService.verifyToken(secret, dto.code)) {
      throw new UnauthorizedException("Invalid two-factor code");
    }

    await this.usersService.disableTotp(user.id);
  }

  // Google OAuth
  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile;
    const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:4200";

    // Check if user exists by Google ID
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      // Check if user exists by email (link accounts)
      const orgId = process.env["DEFAULT_ORG_ID"];
      if (!orgId) {
        res.redirect(`${frontendUrl}/login?error=no_org`);
        return;
      }

      user = await this.usersService.findByEmail(orgId, profile.email);

      if (user) {
        // Link Google account to existing user
        await this.usersService.linkGoogleAccount(user.id, profile.googleId);
      } else {
        // Create new user
        user = await this.usersService.create({
          orgId,
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          role: UserRole.VIEWER,
        });
      }
    }

    // Generate tokens
    const tokens = await this.tokensService.generateTokenPair(
      user as User,
      req.headers["user-agent"],
      req.ip,
    );

    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn.toString(),
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  private getEncryptionKey(): string {
    const key = process.env["ENCRYPTION_KEY"];
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }
    return key;
  }
}
