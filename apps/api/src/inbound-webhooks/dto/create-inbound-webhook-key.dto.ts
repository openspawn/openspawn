import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { TaskPriority } from "@openspawn/shared-types";

export class CreateInboundWebhookKeyDto {
  @IsString()
  @MaxLength(255)
  name!: string;

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
}
