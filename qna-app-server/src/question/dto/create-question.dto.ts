import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  QuestionDifficulty,
  QuestionType
} from "../../generated/prisma/enums.js";

export class QuestionOptionInputDto {
  @ApiProperty({ example: "Paris" })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_correct!: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.mcq })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ example: "What is the capital of France?" })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: 1, description: "Must be greater than 0" })
  @IsInt()
  @Min(1, { message: "points must be greater than 0" })
  points!: number;

  @ApiProperty({
    type: [QuestionOptionInputDto],
    description:
      "mcq needs at least two options with exactly one correct; true_false needs exactly two options with exactly one correct"
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionInputDto)
  options!: QuestionOptionInputDto[];

  @ApiPropertyOptional({
    example: "Paris has been the capital since 987.",
    description: "Shown to admins; not sent to students"
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({ example: "Geography" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    enum: QuestionDifficulty,
    default: QuestionDifficulty.medium
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ type: [String], example: ["europe", "capitals"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
