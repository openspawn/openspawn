import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { AgentRole, Proficiency } from "@openspawn/shared-types";

export class CapabilityDto {
  @IsString()
  @MaxLength(100)
  capability!: string;

  @IsOptional()
  @IsEnum(Proficiency)
  proficiency?: Proficiency;
}

export class CreateAgentDto {
  @IsString()
  @MaxLength(100)
  agentId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  level?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsEnum(AgentRole)
  role?: AgentRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  managementFeePct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetPeriodLimit?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CapabilityDto)
  capabilities?: CapabilityDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
