import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req
} from "@nestjs/common";
import { CreateUserDTO } from "./create-user-dto.js";
import { UserService } from "./user.service.js";
import { LoginUserDTO } from "./login-user-dto.js";
import type { Response } from "express";
import type { Request } from "express";
import { VerifyEmailDTO } from "./verify-email-dto.js";
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

  @Post("/verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() { email, token }: VerifyEmailDTO) {
    return await this.userService.verifyEmailToken(email, token);
  }
  @Get("/dashboard")
  dashboard() {
    return "Welcome student";
  }
  @Get("/admin-panel")
  adminPanel() {
    return "Welcome admin";
  }
}
