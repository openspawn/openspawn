import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class AddDependencyDto {
  @IsUUID()
  dependsOnId!: string;

  @IsOptional()
  @IsBoolean()
  blocking?: boolean;
}
