import { Controller, Get, Param } from "@nestjs/common";
import { StudentService } from "./student.service.js";

@Controller("student")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get("quizzes")
  getQuizzes() {
    return this.studentService.getQuizzes();
  }

  @Get("invite/:token")
  resolveInvite(@Param("token") token: string) {
    return this.studentService.resolveInvite(token);
  }
}