import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
  Req
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import type { Request } from "express";
import { QuestionBankService } from "./question-bank.service.js";
import { CreateQuestionDto } from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import { QuestionBankQueryDto } from "./dto/question-bank-query.dto.js";
import {
  BankQuestionDto,
  QuestionBankFacetsDto,
  QuestionBankPageDto
} from "./dto/question.dto.js";

// Auth/role protection is wired in AppModule.configure() via the RequireAuth
// and RequireRole("admin") middleware, applied to every route on this controller.
@ApiTags("question bank")
@ApiCookieAuth("token")
@Controller("/admin/questions")
export class QuestionBankController {
  constructor(private bank: QuestionBankService) {}

  @Get()
  @ApiOperation({
    summary: "Search and filter the question bank, newest first (admin only)"
  })
  @ApiResponse({ status: 200, type: QuestionBankPageDto })
  @ApiResponse({ status: 400, description: "Invalid filter value" })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  list(@Query() query: QuestionBankQueryDto) {
    return this.bank.list(query);
  }

  // Declared before :id so "facets" isn't read as a question id.
  @Get("facets")
  @ApiOperation({
    summary: "Categories and tags in use, for the filter dropdowns (admin only)"
  })
  @ApiResponse({ status: 200, type: QuestionBankFacetsDto })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  facets() {
    return this.bank.facets();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get one bank question and the quizzes using it (admin only)"
  })
  @ApiResponse({ status: 200, type: BankQuestionDto })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Question not found or deleted" })
  findOne(@Param("id") id: string) {
    return this.bank.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Add a question to the bank (admin only)" })
  @ApiResponse({ status: 201, type: BankQuestionDto })
  @ApiResponse({
    status: 400,
    description:
      "Validation failed (field-level messages, or the mcq/true_false option rules)"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  create(@Body() dto: CreateQuestionDto, @Req() req: Request) {
    return this.bank.create(dto, req.user!.id);
  }

  @Put(":id")
  @ApiOperation({
    summary:
      "Replace a bank question (admin only). Every quiz using it sees the change."
  })
  @ApiResponse({ status: 200, type: BankQuestionDto })
  @ApiResponse({
    status: 400,
    description: "Validation failed, or a quiz using the question is live"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Question not found or deleted" })
  update(@Param("id") id: string, @Body() dto: UpdateQuestionDto) {
    return this.bank.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary:
      "Soft-delete a bank question (admin only). Refused with 409 while a published, unfinished quiz uses it, unless force=true."
  })
  @ApiQuery({
    name: "force",
    required: false,
    type: Boolean,
    description:
      "Also remove the question from published quizzes that haven't ended"
  })
  @ApiResponse({ status: 200, description: "Question deleted" })
  @ApiResponse({
    status: 400,
    description: "It is the last question of a published quiz"
  })
  @ApiResponse({ status: 401, description: "Not logged in" })
  @ApiResponse({ status: 403, description: "Logged in, but not an admin" })
  @ApiResponse({ status: 404, description: "Question not found or deleted" })
  @ApiResponse({
    status: 409,
    description:
      "Used in a live quiz, or in a published quiz and force was not set. The body lists the quizzes."
  })
  remove(
    @Param("id") id: string,
    @Query("force", new ParseBoolPipe({ optional: true })) force?: boolean
  ) {
    return this.bank.remove(id, force ?? false);
  }
}
