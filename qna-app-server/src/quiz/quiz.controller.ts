import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req
} from "@nestjs/common";
import type { Request } from "express";
import { QuizService } from "./quiz.service.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { UpdateQuizDto } from "./dto/update-quiz.dto.js";

// Auth/role protection is wired in AppModule.configure() via the RequireAuth
// and RequireRole("admin") middleware, applied to every route on this controller.
@Controller("/admin/quizzes")
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Post()
  create(@Body() dto: CreateQuizDto, @Req() req: Request) {
    return this.quizService.create(dto, req.user!.id);
  }

  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quizService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.quizService.remove(id);
  }
}
