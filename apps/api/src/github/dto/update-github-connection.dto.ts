import { IsString, IsOptional, IsArray, IsBoolean } from "class-validator";

export class UpdateGitHubConnectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsArray()
  repoFilter?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  createTaskOnIssue?: boolean;

  @IsOptional()
  @IsBoolean()
  createTaskOnPR?: boolean;

  @IsOptional()
  @IsBoolean()
  closeIssueOnComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  commentOnStatusChange?: boolean;
}
