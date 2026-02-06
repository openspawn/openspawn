import { IsOptional, IsString, IsUUID } from "class-validator";

export class AddCommentDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
