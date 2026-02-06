import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

import { MessageType } from "@openspawn/shared-types";

export class SendMessageDto {
  @IsUUID()
  channelId!: string;

  @IsEnum(MessageType)
  type!: MessageType;

  @IsString()
  body!: string;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
