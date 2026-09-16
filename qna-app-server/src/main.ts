import "dotenv/config";
import net from "node:net";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

// Node tries each address of the database host for only 250ms by default; on
// a slow connection every attempt is cut off and all DB calls fail with
// ETIMEDOUT. Give each attempt a few seconds instead.
net.setDefaultAutoSelectFamilyAttemptTimeout(5_000);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle("QnA App API")
    .setDescription(
      "Auth, and admin quiz management. Admin routes require the " +
        "'token' cookie set by POST /auth/login for an account with role 'admin'."
    )
    .setVersion("1.0")
    .addTag("auth")
    .addTag("quizzes")
    .addTag("questions")
    .addTag("attempts")
    .addCookieAuth("token")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
