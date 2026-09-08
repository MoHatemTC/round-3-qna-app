import { IsEmail, IsNotEmpty } from "class-validator";

export class ResendVerificationDTO {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;
}
