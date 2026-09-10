import { ApiProperty } from "@nestjs/swagger";
import { AttemptStatus } from "../../generated/prisma/enums.js";

// The shape every /attempts response returns. Keep in sync with attempt.service.ts.
export class AttemptDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  quiz_id!: string;

  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  user_id!: string;

  @ApiProperty({ example: "2026-09-10T09:00:00.000Z" })
  started_at!: string;

  @ApiProperty({
    type: String,
    example: "2026-09-10T09:25:00.000Z",
    nullable: true
  })
  submitted_at!: string | null;

  @ApiProperty({ enum: AttemptStatus, example: AttemptStatus.in_progress })
  status!: AttemptStatus;

  @ApiProperty({ type: Number, nullable: true, example: 0 })
  score!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 0 })
  percentage!: number | null;
}

export class StartAttemptResponseDto extends AttemptDto {
  @ApiProperty({
    example: "2026-09-10T09:30:00.000Z",
    description:
      "Server-computed deadline: min(started_at + quiz duration, quiz.ends_at)"
  })
  end_time!: string;
}

export class AttemptAnswerDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  question_id!: string;

  @ApiProperty({ type: String, nullable: true })
  selected_option_id!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  boolean_answer!: boolean | null;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    description: "Null until the quiz-authoring feature can score it"
  })
  is_correct!: boolean | null;
}

export class AttemptResultDto extends AttemptDto {
  @ApiProperty({ type: [AttemptAnswerDto] })
  answers!: AttemptAnswerDto[];
}
