import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { QuestionType } from "../../generated/prisma/enums.js";

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
}
