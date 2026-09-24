import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AttachQuestionsDto {
  @ApiProperty({
    type: [String],
    description: "Bank question ids to add to the end of the quiz, in order"
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  question_ids!: string[];
}

export class ReorderQuestionsDto {
  @ApiProperty({
    type: [String],
    description: "Every question id in the quiz, in the new order"
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID("all", { each: true })
  question_ids!: string[];
}
