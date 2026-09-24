import { ApiProperty } from "@nestjs/swagger";
import {
  QuestionDifficulty,
  QuestionType,
  QuizStatus
} from "../../generated/prisma/enums.js";

// The admin shapes returned by /admin/questions and
// /admin/quizzes/:quizId/questions. Keep in sync with bankQuestionInclude in
// question-bank.service.ts.
export class QuestionOptionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "Paris" })
  text!: string;

  @ApiProperty({ example: true })
  is_correct!: boolean;
}

export class QuestionUsageQuizDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "JavaScript Fundamentals" })
  title!: string;

  @ApiProperty({ enum: QuizStatus })
  status!: QuizStatus;

  @ApiProperty({ example: "2026-09-10T09:00:00.000Z" })
  starts_at!: string;

  @ApiProperty({ example: "2026-09-10T10:00:00.000Z" })
  ends_at!: string;
}

export class QuestionUsageDto {
  @ApiProperty({ example: 0, description: "Position within that quiz" })
  position!: number;

  @ApiProperty({ type: QuestionUsageQuizDto })
  quiz!: QuestionUsageQuizDto;
}

export class BankQuestionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.mcq })
  type!: QuestionType;

  @ApiProperty({ example: "What is the capital of France?" })
  text!: string;

  @ApiProperty({ example: 1 })
  points!: number;

  @ApiProperty({ type: String, nullable: true })
  explanation!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "Geography" })
  category!: string | null;

  @ApiProperty({ enum: QuestionDifficulty, example: QuestionDifficulty.medium })
  difficulty!: QuestionDifficulty;

  @ApiProperty({ type: [String], example: ["europe", "capitals"] })
  tags!: string[];

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiProperty({ type: String, nullable: true })
  created_by!: string | null;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  updated_at!: string;

  @ApiProperty({ type: [QuestionOptionDto] })
  options!: QuestionOptionDto[];

  @ApiProperty({
    type: [QuestionUsageDto],
    description: "Every quiz this question is used in"
  })
  quizzes!: QuestionUsageDto[];
}

// A bank question as seen from one quiz.
export class QuestionDto extends BankQuestionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  quiz_id!: string;

  @ApiProperty({ example: 0, description: "Order within this quiz" })
  position!: number;
}

export class QuestionBankPageDto {
  @ApiProperty({ type: [BankQuestionDto] })
  items!: BankQuestionDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  page_size!: number;
}

export class QuestionBankFacetsDto {
  @ApiProperty({ type: [String], example: ["Geography", "JavaScript"] })
  categories!: string[];

  @ApiProperty({ type: [String], example: ["async", "europe"] })
  tags!: string[];

  @ApiProperty({ enum: QuestionType, isArray: true })
  types!: QuestionType[];

  @ApiProperty({ enum: QuestionDifficulty, isArray: true })
  difficulties!: QuestionDifficulty[];
}

export class AttachQuestionsResultDto {
  @ApiProperty({ example: 3 })
  added!: number;

  @ApiProperty({
    example: 1,
    description: "Already in the quiz, so not added again"
  })
  skipped!: number;

  @ApiProperty({
    type: [QuestionDto],
    description: "The quiz's full question list, in order"
  })
  questions!: QuestionDto[];
}

// The student-facing shape from GET /quizzes/:id/questions/for-attempt.
// There is intentionally no is_correct field anywhere in it.
export class AttemptQuestionOptionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "Paris" })
  text!: string;
}

export class AttemptQuestionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.mcq })
  type!: QuestionType;

  @ApiProperty({ example: "What is the capital of France?" })
  text!: string;

  @ApiProperty({ example: 1 })
  points!: number;

  @ApiProperty({ type: [AttemptQuestionOptionDto] })
  options!: AttemptQuestionOptionDto[];
}
