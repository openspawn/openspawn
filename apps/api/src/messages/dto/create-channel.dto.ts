import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { ChannelType } from "@openspawn/shared-types";

export class CreateChannelDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsEnum(ChannelType)
  type!: ChannelType;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
