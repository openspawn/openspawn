import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { WebhookTaskDto } from "./webhook-task.dto";

export class WebhookBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookTaskDto)
  tasks!: WebhookTaskDto[];
}
