import { ArrayMaxSize, IsArray, IsOptional, IsString } from "class-validator";

export class CreateInvitationDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsOptional()
  @IsString({ each: true })
  emails?: string[];

  @IsArray()
  @ArrayMaxSize(100)
  @IsOptional()
  @IsString({ each: true })
  userIds?: string[];
}
