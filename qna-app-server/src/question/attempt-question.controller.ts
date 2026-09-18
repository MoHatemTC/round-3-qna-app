import { Controller, Get, Param, Req } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import type { Request } from "express";
import { QuestionService } from "./question.service.js";
import { AttemptQuestionDto } from "./dto/question.dto.js";

// Auth is wired in AppModule.configure() via the RequireAuth middleware.
// Role checks happen in QuestionService.findForAttempt.
@ApiTags("questions")
@ApiCookieAuth("token")
@Controller("/quizzes/:id/questions")
export class AttemptQuestionController {
  constructor(private questionService: QuestionService) {}

  @Get("for-attempt")
  @ApiOperation({
    summary:
      "Questions for taking a quiz - text, type and options, without correct answers"
  })
  @ApiResponse({
    status: 200,
    description: "Question list (no is_correct fields)",
    type: [AttemptQuestionDto]
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({
    status: 403,
    description: "No in-progress attempt on this quiz"
  })
  @ApiResponse({ status: 404, description: "Quiz not found or not published" })
  findForAttempt(@Param("id") id: string, @Req() req: Request) {
    return this.questionService.findForAttempt(id, req.user!);
  }
}
