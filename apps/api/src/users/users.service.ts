import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User, UserRole } from "@openspawn/database";

const BCRYPT_ROUNDS = 12;

export interface CreateUserDto {
  orgId: string;
  email: string;
  password?: string;
  name: string;
  role?: UserRole;
  googleId?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: { orgId: dto.orgId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const user = this.userRepository.create({
      orgId: dto.orgId,
      email: dto.email.toLowerCase(),
      name: dto.name,
      role: dto.role ?? UserRole.VIEWER,
      googleId: dto.googleId ?? null,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS) : null,
    });

    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(orgId: string, email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { orgId, email: email.toLowerCase() },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findByOrg(orgId: string): Promise<User[]> {
    return this.userRepository.find({ where: { orgId } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updateProfile(id: string, dto: { name?: string; email?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.email !== undefined) {
      user.email = dto.email;
      user.emailVerified = false; // Require re-verification on email change
    }

    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepository.update(id, { passwordHash });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  // TOTP methods
  async enableTotp(id: string, secretEnc: Buffer): Promise<void> {
    await this.userRepository.update(id, {
      totpSecretEnc: secretEnc,
      totpEnabled: true,
    });
  }

  async disableTotp(id: string): Promise<void> {
    await this.userRepository.update(id, {
      totpSecretEnc: null,
      totpEnabled: false,
      recoveryCodesEnc: null,
    });
  }

  async setRecoveryCodes(id: string, codesEnc: Buffer): Promise<void> {
    await this.userRepository.update(id, { recoveryCodesEnc: codesEnc });
  }

  async linkGoogleAccount(id: string, googleId: string): Promise<void> {
    await this.userRepository.update(id, { googleId, emailVerified: true });
  }
}
