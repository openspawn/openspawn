import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./decorators";
import type { JwtUser } from "./jwt.strategy";
import { ApiKeysService, ApiKeyWithSecret, ApiKeyResponse } from "./api-keys.service";
import { ApiKeyScope } from "@openspawn/database";

class CreateApiKeyBodyDto {
  name!: string;
  scopes?: ApiKeyScope[];
  expiresInDays?: number;
}

@Controller("api-keys")
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateApiKeyBodyDto
  ): Promise<ApiKeyWithSecret> {
    if (!user) throw new Error("User not authenticated");
    return this.apiKeysService.create(user.id, user.orgId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtUser): Promise<ApiKeyResponse[]> {
    if (!user) throw new Error("User not authenticated");
    return this.apiKeysService.findAllForUser(user.id, user.orgId);
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser
  ): Promise<ApiKeyResponse> {
    if (!user) throw new Error("User not authenticated");
    return this.apiKeysService.findOne(id, user.id, user.orgId);
  }

  @Delete(":id")
  async revoke(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser
  ): Promise<{ message: string }> {
    if (!user) throw new Error("User not authenticated");
    await this.apiKeysService.revoke(id, user.id, user.orgId);
    return { message: "API key revoked" };
  }
}
