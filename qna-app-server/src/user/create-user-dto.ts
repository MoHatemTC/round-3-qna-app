import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum
} from "class-validator";
import { Role } from "../generated/prisma/enums.js";

export class CreateUserDTO {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
