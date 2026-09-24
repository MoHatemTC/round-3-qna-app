import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { QuestionService } from "./question.service.js";
import { CreateQuestionDto } from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import {
  AttachQuestionsDto,
  ReorderQuestionsDto
} from "./dto/quiz-question-links.dto.js";
import { AttachQuestionsResultDto, QuestionDto } from "./dto/question.dto.js";

// Auth/role protection is wired in AppModule.configure() via the RequireAuth
// and RequireRole("admin") middleware, applied to every route on this controller.
@ApiTags("questions")
@ApiCookieAuth("token")
@Controller("/admin/quizzes/:quizId/questions")
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: "List a quiz's questions in order (admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question list",
    type: [QuestionDto]
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  findAll(@Param("quizId") quizId: string) {
    return this.questionService.findAll(quizId);
  }

  @Post()
  @ApiOperation({
    summary:
      "Create a question, save it to the question bank and add it to the end of this quiz (admin only)"
  })
  @ApiResponse({
    status: 201,
    description: "Question created",
    type: QuestionDto
  })
  @ApiResponse({
    status: 400,
    description:
      "Validation failed (field-level messages, or the mcq/true_false option rules)"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  create(
    @Param("quizId") quizId: string,
    @Body() dto: CreateQuestionDto,
    @Req() req: Request
  ) {
    return this.questionService.create(quizId, dto, req.user!.id);
  }

  @Post("attach")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Add existing question-bank questions to the end of this quiz (admin only). Questions already in the quiz are skipped."
  })
  @ApiResponse({ status: 200, type: AttachQuestionsResultDto })
  @ApiResponse({
    status: 400,
    description: "Validation failed, or the quiz is live"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({
    status: 404,
    description: "Quiz not found, or a question is no longer in the bank"
  })
  attach(@Param("quizId") quizId: string, @Body() dto: AttachQuestionsDto) {
    return this.questionService.attach(quizId, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Set the order of this quiz's questions (admin only)"
  })
  @ApiResponse({
    status: 200,
    description: "The quiz's questions in their new order",
    type: [QuestionDto]
  })
  @ApiResponse({
    status: 400,
    description:
      "The list doesn't match the quiz's questions exactly, or the quiz is live"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  reorder(@Param("quizId") quizId: string, @Body() dto: ReorderQuestionsDto) {
    return this.questionService.reorder(quizId, dto);
  }

  @Put(":questionId")
  @ApiOperation({
    summary:
      "Replace a question and its options (admin only). This edits the bank question, so every quiz using it changes."
  })
  @ApiResponse({
    status: 200,
    description: "Question updated",
    type: QuestionDto
  })
  @ApiResponse({
    status: 400,
    description:
      "Validation failed (field-level messages, or the mcq/true_false option rules), or a quiz using it is live"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz or question not found" })
  update(
    @Param("quizId") quizId: string,
    @Param("questionId") questionId: string,
    @Body() dto: UpdateQuestionDto
  ) {
    return this.questionService.update(quizId, questionId, dto);
  }

  @Delete(":questionId")
  @ApiOperation({
    summary:
      "Remove a question from this quiz (admin only). It stays in the question bank."
  })
  @ApiResponse({ status: 200, description: "Question removed from the quiz" })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Quiz or question not found" })
  remove(
    @Param("quizId") quizId: string,
    @Param("questionId") questionId: string
  ) {
    return this.questionService.remove(quizId, questionId);
  }
}
