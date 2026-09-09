import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import type { Request } from "express";
import { AttemptService } from "./attempt.service.js";
import { StartAttemptDto } from "./dto/start-attempt.dto.js";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto.js";
import {
  AttemptResultDto,
  StartAttemptResponseDto
} from "./dto/attempt.dto.js";

// Auth is wired in AppModule.configure() via the RequireAuth middleware,
// applied to every route on this controller. Any logged-in user (student or
// admin) may attempt a quiz.
@ApiTags("attempts")
@ApiCookieAuth("token")
@Controller("/attempts")
export class AttemptController {
  constructor(private attemptService: AttemptService) {}

  @Post("/start")
  @ApiOperation({ summary: "Start (or resume) an attempt on a published quiz" })
  @ApiResponse({
    status: 201,
    description: "Attempt id and server-side end time",
    type: StartAttemptResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Quiz not published or outside its time window"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  @ApiResponse({ status: 409, description: "Quiz already attempted" })
  start(@Body() dto: StartAttemptDto, @Req() req: Request) {
    return this.attemptService.start(dto, req.user!.id);
  }

  @Post("/:id/submit")
  @ApiOperation({ summary: "Submit answers for an in-progress attempt" })
  @ApiResponse({
    status: 200,
    description: "Attempt submitted",
    type: AttemptResultDto
  })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Attempt belongs to another user" })
  @ApiResponse({ status: 404, description: "Attempt not found" })
  @ApiResponse({ status: 409, description: "Attempt already submitted" })
  submit(
    @Param("id") id: string,
    @Body() dto: SubmitAttemptDto,
    @Req() req: Request
  ) {
    return this.attemptService.submit(id, dto, req.user!.id);
  }

  @Get("/:id/result")
  @ApiOperation({ summary: "Get an attempt's answers and score" })
  @ApiResponse({
    status: 200,
    description: "Attempt result",
    type: AttemptResultDto
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Attempt belongs to another user" })
  @ApiResponse({ status: 404, description: "Attempt not found" })
  getResult(@Param("id") id: string, @Req() req: Request) {
    return this.attemptService.getResult(id, req.user!.id);
  }
}
