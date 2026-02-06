import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

import { EventSeverity } from "@openspawn/shared-types";

export class QueryEventsDto {
  @IsOptional()
  type?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsEnum(EventSeverity)
  severity?: EventSeverity;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
