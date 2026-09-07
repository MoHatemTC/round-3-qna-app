import { ApiProperty } from "@nestjs/swagger";
import { QuizStatus } from "../../generated/prisma/enums.js";

// The shape every /admin/quizzes response returns. This is the published
// contract other teams build against - keep it in sync with quiz.service.ts.
export class QuizDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "JavaScript Fundamentals" })
  title!: string;

  @ApiProperty({
    type: String,
    example: "Covers closures, prototypes, and async/await.",
    nullable: true
  })
  description!: string | null;

  @ApiProperty({ example: 30, description: "Duration in minutes" })
  duration_minutes!: number;

  @ApiProperty({ example: "2026-09-10T09:00:00.000Z" })
  starts_at!: string;

  @ApiProperty({ example: "2026-09-10T10:00:00.000Z" })
  ends_at!: string;

  @ApiProperty({ enum: QuizStatus, example: QuizStatus.draft })
  status!: QuizStatus;

  @ApiProperty({ description: "User id of the admin who created the quiz" })
  created_by!: string;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  updated_at!: string;
}
