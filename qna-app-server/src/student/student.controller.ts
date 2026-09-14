import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { StudentService } from "./student.service.js";
import { EmailVerifiedGuard } from "../user/guards/email-verified.guard.js";

@Controller("student")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get("quizzes")
  getQuizzes(@Req() req: Request) {
    return this.studentService.getQuizzes(req.user!.id);
  }

  @Get("quizzes/:id")
  @UseGuards(EmailVerifiedGuard)
  getQuiz(@Param("id") id: string, @Req() req: Request) {
    return this.studentService.getQuiz(id, req.user!.id);
  }

  @Get("invite/:token")
  resolveInvite(@Param("token") token: string, @Req() req: Request) {
    return this.studentService.resolveInvite(token, req.user!.id);
  }
}