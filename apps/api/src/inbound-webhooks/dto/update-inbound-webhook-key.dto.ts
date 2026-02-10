import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { TaskPriority } from "@openspawn/shared-types";

export class UpdateInboundWebhookKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  defaultAgentId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  defaultPriority?: TaskPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultTags?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
