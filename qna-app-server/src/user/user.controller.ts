import { Controller, Get } from "@nestjs/common";
@Controller("/auth")
export class UserController {
  @Get("/login")
  login() {
    return "Hello user!";
  }
}
