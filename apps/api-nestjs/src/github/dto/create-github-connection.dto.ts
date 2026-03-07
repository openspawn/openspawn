import { IsString, IsOptional, IsArray, IsBoolean } from "class-validator";

export class CreateGitHubConnectionDto {
  @IsString()
  name!: string;

  @IsString()
  installationId!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsArray()
  repoFilter?: string[];

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
