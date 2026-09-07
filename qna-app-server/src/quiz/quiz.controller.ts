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
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import type { Request } from "express";
import { QuizService } from "./quiz.service.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { UpdateQuizDto } from "./dto/update-quiz.dto.js";
import { QuizDto } from "./dto/quiz.dto.js";

// Auth/role protection is wired in AppModule.configure() via the RequireAuth
// and RequireRole("admin") middleware, applied to every route on this controller.
@ApiTags("quizzes")
@ApiCookieAuth("token")
@Controller("/admin/quizzes")
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Post()
  @ApiOperation({ summary: "Create a quiz (admin only)" })
  @ApiResponse({ status: 201, description: "Quiz created", type: QuizDto })
  @ApiResponse({
    status: 400,
    description: "Validation failed (field-level messages)"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  create(@Body() dto: CreateQuizDto, @Req() req: Request) {
    return this.quizService.create(dto, req.user!.id);
  }

  @Get()
  @ApiOperation({ summary: "List all quizzes (admin only)" })
  @ApiResponse({ status: 200, description: "Quiz list", type: [QuizDto] })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  findAll() {
    return this.quizService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one quiz by id (admin only)" })
  @ApiResponse({ status: 200, description: "Quiz found", type: QuizDto })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  findOne(@Param("id") id: string) {
    return this.quizService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Replace a quiz (admin only)" })
  @ApiResponse({ status: 200, description: "Quiz updated", type: QuizDto })
  @ApiResponse({
    status: 400,
    description: "Validation failed (field-level messages)"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  update(@Param("id") id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a quiz (admin only)" })
  @ApiResponse({ status: 200, description: "Quiz deleted" })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  remove(@Param("id") id: string) {
    return this.quizService.remove(id);
  }
}
