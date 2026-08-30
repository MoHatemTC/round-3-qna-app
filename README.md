# QnA App

This project contains two apps:

- `qna-app-server` — NestJS backend with Prisma ORM and PostgreSQL
- `qna-app-client` — React + Vite frontend with Tailwind CSS and shadcn/ui

The goal is to help understand how the frontend and backend work together in a full-stack application.

---

## 1) Project structure

```bash
qna-app/
├── qna-app-client/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── components.json
│   └── index.html
├── qna-app-server/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 2) Requirements

Before starting, install:

- Node.js 18+
- npm
- PostgreSQL (for local database)
- VS Code (recommended)

Check versions:

```bash
node -v
npm -v
```

---

## 3) Backend: NestJS guide

The server app is in `qna-app-server`.

### Install dependencies

```bash
cd qna-app-server
npm install
```

### Run the server in development mode

```bash
npm run start:dev
```

The app starts on port `3000` by default.

### Basic NestJS concepts

NestJS is organized in modules, controllers, and services.

- `Module` = a feature area
- `Controller` = handles HTTP routes
- `Service` = contains business logic
- `Provider` = class used by Nest for dependency injection

This project already has a `UserModule` example.

### How to add a new Nest module

Example: create a `questions` module.

```bash
cd qna-app-server
npx nest g module questions
npx nest g controller questions
npx nest g service questions
```

This will create files similar to:

```bash
src/questions/questions.module.ts
src/questions/questions.controller.ts
src/questions/questions.service.ts
```

Then import the module into the root app:

```ts
// src/app.module.ts
import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module.js";
import { QuestionsModule } from "./questions/questions.module.js";

@Module({
  imports: [UserModule, QuestionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Example controller

```ts
import { Controller, Get } from "@nestjs/common";

@Controller("questions")
export class QuestionsController {
  @Get()
  getAllQuestions() {
    return ["Question 1", "Question 2"];
  }
}
```

### Example service

```ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class QuestionsService {
  getAllQuestions() {
    return ["Question 1", "Question 2"];
  }
}
```

### Example module

```ts
import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller.js";
import { QuestionsService } from "./questions.service.js";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
```

> This project uses ES module imports with `.js` extensions in TypeScript files, so keep that pattern when creating new Nest files.

---

## 4) Prisma v7.10 guide

This project uses Prisma version `7.10.0` in the server app.

Check the server dependencies:

```json
"@prisma/client": "^7.10.0",
"prisma": "^7.10.0"
```

The Prisma schema is in:

```bash
qna-app-server/prisma/schema.prisma
```

### Current schema example

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  admin
  student
}

model User {
  id                String    @id @default(uuid())
  name              String
  email             String    @unique
  password_hash     String
  role              Role      @default(student)
  email_verified_at DateTime?
  created_at        DateTime  @default(now())
}
```

### How to add a new Prisma model

Open `prisma/schema.prisma` and add a new model.

Example:

```prisma
model Question {
  id         String   @id @default(uuid())
  title      String
  content    String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

Then run:

```bash
cd qna-app-server
npx prisma migrate dev --name add_question_model
```

This will:

1. check the schema
2. generate the Prisma client
3. create a migration file
4. apply the migration to your database

If it is the first migration in the project, you can also run:

```bash
npx prisma migrate dev --name init
```

### Useful Prisma commands

Generate the client after schema changes:

```bash
npx prisma generate
```

Check current DB and migration status:

```bash
npx prisma migrate status
```

Open Prisma Studio to view the data:

```bash
npx prisma studio
```

### Prisma best practice

- Always update `schema.prisma` first
- Then run `npx prisma migrate dev --name ...`
- Regenerate Prisma client if needed
- Keep model names in PascalCase and fields in camelCase

---

## 5) Using Prisma in NestJS

The project already includes Prisma service pattern. Example:

```ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

Then inject it into a service:

```ts
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

---

## 6) Important backend setup in main.ts

The server entry file is:

```bash
qna-app-server/src/main.ts
```

This file already sets up the app and includes useful configuration:

```ts
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
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Cats example")
    .setDescription("The cats API description")
    .setVersion("1.0")
    .addTag("cats")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

What this does:

- `enableCors()` allows frontend requests from React
- `ValidationPipe()` validates incoming request data
- `SwaggerModule.setup("api", ...)` exposes API docs at `/api`
- `cookieParser()` reads cookies in requests

Open Swagger in the browser after starting the server:

```bash
http://localhost:3000/api
```

---

## 7) Frontend: React + Vite + Tailwind + shadcn

The client app is in `qna-app-client`.

### Install dependencies

```bash
cd qna-app-client
npm install
```

### Run React app locally

```bash
npm run dev
```

This will start Vite and usually open the app at:

```bash
http://localhost:5173
```

### Tailwind CSS setup

This project already includes Tailwind v4 and shadcn style config:

- `@tailwindcss/vite`
- `tailwindcss`
- `@import "tailwindcss"` inside `src/index.css`
- `components.json` for shadcn configuration

The main stylesheet is:

```bash
qna-app-client/src/index.css
```

### Add a shadcn component

Example: add a button:

```bash
cd qna-app-client
npx shadcn@latest add button
```

This will create/add component files under `src/components/ui` and let you use them in React components.

### Example usage

```jsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-6">
      <Button>Click me</Button>
    </div>
  );
}
```

### Tailwind class example

```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Hello from React + Tailwind
</div>
```

### Useful client commands

Build the app:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 8) Running both apps together

Open two terminals.

Terminal 1 — backend:

```bash
cd qna-app-server
npm install
npm run start:dev
```

Terminal 2 — frontend:

```bash
cd qna-app-client
npm install
npm run dev
```

Then:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api`

---

## 9)  workflow for a new feature

A simple feature workflow is:

1. Create a new Nest module
2. Add a controller and service
3. Add Prisma model in `prisma/schema.prisma`
4. Run `npx prisma migrate dev --name ...`
5. Use Prisma service in Nest
6. Call backend API from React
7. Show the result in a React component using Tailwind/shadcn

Example flow:

```bash
cd qna-app-server
npx nest g module questions
npx nest g controller questions
npx nest g service questions
```

Then update the Prisma schema:

```prisma
model Question {
  id         String   @id @default(uuid())
  title      String
  body       String
  created_at DateTime @default(now())
}
```

Then migrate:

```bash
npx prisma migrate dev --name add_question_model
```

Then use it in your service and controller.

---

## 10) Common  tips

- Start with the backend first, then connect the frontend
- Use `npm run start:dev` for live NestJS reloads
- Use `npm run dev` for live Vite reloads
- Keep Prisma schema and database in sync
- Always restart the backend after changing server files
- Use Swagger to test APIs quickly

---

## 11) Quick start summary

```bash
# backend
cd qna-app-server
npm install
npm run start:dev

# frontend
cd ../qna-app-client
npm install
npm run dev
```

---

## 12) Final note

This project is a good starting point for building a full-stack app with NestJS, Prisma, React, Tailwind CSS, and shadcn/ui. As you grow, you can add more modules, models, routes, and UI components while keeping the app simple and easy to understand.
