import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StartAttemptDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  @IsString()
  @MinLength(1)
  quiz_id!: string;
}
