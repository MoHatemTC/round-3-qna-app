import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  QuestionDifficulty,
  QuestionType
} from "../../generated/prisma/enums.js";

// ?tags=a&tags=b and ?tags=a,b both arrive as a list.
function toList(value: unknown): string[] | undefined {
  if (value === undefined || value === "") return undefined;
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export class QuestionBankQueryDto {
  @ApiPropertyOptional({
    description: "Matches question text (case-insensitive)"
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ example: "Geography" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "Questions carrying any of these tags"
  })
  @IsOptional()
  @Transform(({ value }) => toList(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: "2026-09-01" })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: "2026-09-30" })
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiPropertyOptional({
    description:
      "Leave out questions already in this quiz (for the quiz picker)"
  })
  @IsOptional()
  @IsUUID()
  exclude_quiz_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number;
}
