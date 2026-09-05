import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { UserModule } from "./user/user.module.js";
import { MailModule } from "./mail/mail.module.js";
import { RequireAuth, RequireRole } from "../middlewares/auth.middleware.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { PrismaModule } from "./prisma.module.js";
import { QuizModule } from "./quiz/quiz.module.js";
import { QuizController } from "./quiz/quiz.controller.js";

@Module({
  imports: [
    PrismaModule,
    UserModule,
    MailModule,
    NotificationsModule,
    QuizModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireAuth)
      .forRoutes(
        { path: "auth/admin-panel", method: RequestMethod.GET },
        { path: "auth/dashboard", method: RequestMethod.GET },
        { path: "auth/session", method: RequestMethod.GET },
        QuizController
      );

    consumer
      .apply(RequireRole("admin"))
      .forRoutes(
        { path: "auth/admin-panel", method: RequestMethod.GET },
        QuizController
      );
  }
}
