import { Module } from "@nestjs/common";
import { QuestionController } from "./question.controller.js";
import { QuestionBankController } from "./question-bank.controller.js";
import { AttemptQuestionController } from "./attempt-question.controller.js";
import { QuestionService } from "./question.service.js";
import { QuestionBankService } from "./question-bank.service.js";
import { AnswerKeyService } from "./answer-key.service.js";

@Module({
  controllers: [
    QuestionController,
    QuestionBankController,
    AttemptQuestionController
  ],
  providers: [QuestionService, QuestionBankService, AnswerKeyService],
  exports: [QuestionService, AnswerKeyService]
})
export class QuestionModule {}
