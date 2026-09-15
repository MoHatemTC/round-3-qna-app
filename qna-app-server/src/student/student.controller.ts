import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from "@nestjs/common";
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

  @Get("notifications")
  getNotifications(@Req() req: Request) {
    return this.studentService.getNotifications(req.user!.id);
  }

  // Declared before ":id/read" so "read-all" is never treated as an id.
  @Post("notifications/read-all")
  @HttpCode(HttpStatus.OK)
  markAllNotificationsRead(@Req() req: Request) {
    return this.studentService.markAllNotificationsRead(req.user!.id);
  }

  @Post("notifications/:id/read")
  @HttpCode(HttpStatus.OK)
  markNotificationRead(@Param("id") id: string, @Req() req: Request) {
    return this.studentService.markNotificationRead(id, req.user!.id);
  }
}
