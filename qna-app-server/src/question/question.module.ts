import { Module } from "@nestjs/common";
import { QuestionController } from "./question.controller.js";
import { AttemptQuestionController } from "./attempt-question.controller.js";
import { QuestionService } from "./question.service.js";
import { AnswerKeyService } from "./answer-key.service.js";

@Module({
  controllers: [QuestionController, AttemptQuestionController],
  providers: [QuestionService, AnswerKeyService],
  exports: [QuestionService, AnswerKeyService]
})
export class QuestionModule {}
