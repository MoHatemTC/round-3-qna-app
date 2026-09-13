import { IsArray, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateInvitationDto {
  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true })
  emails?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  usersId?: string[];
}
