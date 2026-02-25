import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, IsInt, Min, Max, IsIn } from "class-validator";

export class CreateWebhookDto {
  @IsString()
  name!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

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
