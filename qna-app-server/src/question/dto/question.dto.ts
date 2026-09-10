import { ApiProperty } from "@nestjs/swagger";
import { QuestionType } from "../../generated/prisma/enums.js";

// The shape every /admin/quizzes/:quizId/questions response returns. Keep in
// sync with question.service.ts.
export class QuestionOptionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "Paris" })
  text!: string;

  @ApiProperty({ example: true })
  is_correct!: boolean;
}

export class QuestionDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  quiz_id!: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.mcq })
  type!: QuestionType;

  @ApiProperty({ example: "What is the capital of France?" })
  text!: string;

  @ApiProperty({ example: 1 })
  points!: number;

  @ApiProperty({ type: [QuestionOptionDto] })
  options!: QuestionOptionDto[];
}
