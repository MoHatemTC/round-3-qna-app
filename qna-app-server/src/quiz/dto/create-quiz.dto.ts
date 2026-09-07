import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { QuizStatus } from "../../generated/prisma/enums.js";
import { IsAfter } from "../validators/is-after.validator.js";

export class CreateQuizDto {
  @ApiProperty({ example: "JavaScript Fundamentals" })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({
    example: "Covers closures, prototypes, and async/await."
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30, description: "Must be greater than 0" })
  @IsInt()
  @Min(1, { message: "duration_minutes must be greater than 0" })
  duration_minutes!: number;

  @ApiProperty({ example: "2026-09-10T09:00:00.000Z" })
  @IsDateString()
  starts_at!: string;

  @ApiProperty({
    example: "2026-09-10T10:00:00.000Z",
    description: "Must be after starts_at"
  })
  @IsDateString()
  @IsAfter("starts_at", { message: "ends_at must be after starts_at" })
  ends_at!: string;

  @ApiPropertyOptional({ enum: QuizStatus, default: QuizStatus.draft })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
