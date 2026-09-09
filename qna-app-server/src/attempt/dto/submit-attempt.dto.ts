import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AnswerDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  @IsString()
  @MinLength(1)
  question_id!: string;

  @ApiPropertyOptional({
    description: "Set for multiple-choice questions",
    example: "c4a2d3c1-0d4b-5c2f-9b3b-7c7f0c7c2b21"
  })
  @IsOptional()
  @IsString()
  selected_option_id?: string;

  @ApiPropertyOptional({
    description: "Set for true/false questions",
    example: true
  })
  @IsOptional()
  @IsBoolean()
  boolean_answer?: boolean;
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
