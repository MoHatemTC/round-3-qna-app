import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  Query
} from "@nestjs/common";
import { CreateUserDTO } from "./dto/create-user-dto.js";
import { UserService } from "./user.service.js";
import { LoginUserDTO } from "./dto/login-user-dto.js";
import type { Response, Request } from "express";
import { ResendVerificationDTO } from "./dto/resend-verification-dto.js";
@Controller("/auth")
export class UserController {
  constructor(private userService: UserService) {}
  @Post("/register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDTO) {
    await this.userService.register(createUserDto);
    return {
      message: "User registered successfully, please verify your mail."
    };
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDTO: LoginUserDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    const { token } = await this.userService.login(loginUserDTO);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });
    return { message: "Welcome back!" };
  }

  @Get("/session")
  session(@Req() req: Request) {
    return { user: req.user };
  }

  @Post("/logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    return { message: "Signed out" };
  }

  @Get("/verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Query("email") email: string,
    @Query("token") token: string
  ) {
    return await this.userService.verifyEmailToken(email, token);
  }

  @Post("/resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDTO
  ) {
    return await this.userService.resendVerificationEmail(
      resendVerificationDto.email
    );
  }
}
