import { IsNotEmpty, IsEmail } from "class-validator";

export class LoginUserDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
