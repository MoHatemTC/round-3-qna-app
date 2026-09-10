import { Controller, Get, Param, Req } from "@nestjs/common";
import type { Request } from "express";
import { StudentService } from "./student.service.js";

@Controller("student")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get("quizzes")
  getQuizzes(@Req() req: Request) {
    return this.studentService.getQuizzes(req.user!.id);
  }

  @Get("quizzes/:id")
  getQuiz(@Param("id") id: string, @Req() req: Request) {
    return this.studentService.getQuiz(id, req.user!.id);
  }

  @Get("invite/:token")
  resolveInvite(@Param("token") token: string, @Req() req: Request) {
    return this.studentService.resolveInvite(token, req.user!.id);
  }
}