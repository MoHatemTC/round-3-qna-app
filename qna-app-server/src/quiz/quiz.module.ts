import { Module } from "@nestjs/common";
import { QuizController } from "./quiz.controller.js";
import { QuizService } from "./quiz.service.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  controllers: [QuizController],
  providers: [QuizService],
  imports: [NotificationsModule]
})
export class QuizModule {}
