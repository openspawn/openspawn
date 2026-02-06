import { IsEnum, IsInt, IsString, IsUUID, Min } from "class-validator";

import { CreditType } from "@openspawn/shared-types";

export class AdjustCreditsDto {
  @IsUUID()
  agentId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsEnum(CreditType)
  type!: CreditType;

  @IsString()
  reason!: string;
}
