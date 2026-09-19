import { Module } from "@nestjs/common";
import { AttemptController } from "./attempt.controller.js";
import { AttemptService } from "./attempt.service.js";
import { EmailVerifiedGuard } from "../user/guards/email-verified.guard.js";
import { QuestionModule } from "../question/question.module.js";

@Module({
  imports: [QuestionModule],
  controllers: [AttemptController],
  providers: [AttemptService, EmailVerifiedGuard]
})
export class AttemptModule {}
