import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";
import { QuizStatus } from "../../generated/prisma/enums.js";
import { IsAfter } from "../validators/is-after.validator.js";

export class CreateQuizDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1, { message: "duration_minutes must be greater than 0" })
  duration_minutes!: number;

  @IsDateString()
  starts_at!: string;

  @IsDateString()
  @IsAfter("starts_at", { message: "ends_at must be after starts_at" })
  ends_at!: string;

  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
