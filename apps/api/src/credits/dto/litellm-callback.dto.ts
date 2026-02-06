import { IsInt, IsString, Min } from "class-validator";

export class LiteLLMCallbackDto {
  @IsString()
  callId!: string;

  @IsString()
  agentId!: string;

  @IsString()
  model!: string;

  @IsInt()
  @Min(0)
  inputTokens!: number;

  @IsInt()
  @Min(0)
  outputTokens!: number;
}
