import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, IsInt, Min, Max, IsIn } from "class-validator";

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(["pre", "post"])
  hookType?: "pre" | "post";

  @IsOptional()
  @IsBoolean()
  canBlock?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeoutMs?: number;
}
