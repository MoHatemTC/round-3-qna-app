import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import { QuestionService } from "./question.service.js";
import { CreateQuestionDto } from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import { QuestionDto } from "./dto/question.dto.js";

// Auth/role protection is wired in AppModule.configure() via the RequireAuth
// and RequireRole("admin") middleware, applied to every route on this controller.
@ApiTags("questions")
@ApiCookieAuth("token")
@Controller("/admin/quizzes/:quizId/questions")
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: "List a quiz's questions (admin only)" })
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
    summary: "Add a question with its options to a quiz (admin only)"
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
  create(@Param("quizId") quizId: string, @Body() dto: CreateQuestionDto) {
    return this.questionService.create(quizId, dto);
  }

  @Put(":questionId")
  @ApiOperation({ summary: "Replace a question and its options (admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question updated",
    type: QuestionDto
  })
  @ApiResponse({
    status: 400,
    description:
      "Validation failed (field-level messages, or the mcq/true_false option rules)"
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
  @ApiOperation({ summary: "Delete a question (admin only)" })
  @ApiResponse({ status: 200, description: "Question deleted" })
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
