import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class SpendCreditsDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  triggerType?: string;

  @IsOptional()
  @IsUUID()
  sourceTaskId?: string;

  @IsOptional()
  @IsUUID()
  sourceAgentId?: string;
}
