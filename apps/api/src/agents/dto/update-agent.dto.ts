import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
  @IsInt()
  @Min(0)
  @Max(50)
  managementFeePct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetPeriodLimit?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
