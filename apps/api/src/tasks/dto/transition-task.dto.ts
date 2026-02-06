import { IsEnum, IsOptional, IsString } from "class-validator";

import { TaskStatus } from "@openspawn/shared-types";

export class TransitionTaskDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
