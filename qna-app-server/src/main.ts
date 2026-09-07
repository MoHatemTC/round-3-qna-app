import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

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
    .addCookieAuth("token")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
