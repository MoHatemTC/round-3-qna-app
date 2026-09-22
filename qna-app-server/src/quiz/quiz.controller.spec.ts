import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from "@jest/globals";
import { BadRequestException, NotFoundException, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { QuizController } from "./quiz.controller.js";
import { QuizService } from "./quiz.service.js";

// Wires the controller to a stubbed service behind the same global
// ValidationPipe main.ts installs, so these tests cover the HTTP contract:
// routing, status codes and request validation.

type StubFn = (...args: any[]) => any;
type ServiceStub = Record<string, jest.Mock<StubFn>>;

async function buildApp(overrides: Partial<ServiceStub> = {}) {
  const quizService: ServiceStub = {
    create: jest.fn(async () => ({ id: "quiz-1", status: "draft" })),
    findAll: jest.fn(async () => []),
    findOne: jest.fn(async () => ({ id: "quiz-1" })),
    update: jest.fn(async () => ({ id: "quiz-1" })),
    remove: jest.fn(async () => ({ message: "Quiz deleted successfully" })),
    publish: jest.fn(async () => ({ id: "quiz-1", status: "published" })),
    unpublish: jest.fn(async () => ({ id: "quiz-1", status: "draft" })),
    invite: jest.fn(async () => ({
      sent: 1,
      failed: 0,
      skipped: 0,
      invalid: 0,
      invalid_emails: [],
      unresolved_user_ids: 0,
      failures: []
    })),
    getQuizInvitations: jest.fn(async () => []),
    getQuizAnalytics: jest.fn(async () => ({ quiz_id: "quiz-1" })),
    getQuizStudents: jest.fn(async () => []),
    ...overrides
  } as ServiceStub;

  const module = await Test.createTestingModule({
    controllers: [QuizController],
    providers: [{ provide: QuizService, useValue: quizService }]
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  // req.user is set by the RequireAuth middleware in the real app.
  app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: "admin-1", role: "admin" };
    next();
  });
  await app.init();
  return { app, quizService };
}

const validQuiz = {
  title: "TypeScript Foundations",
  duration_minutes: 35,
  starts_at: "2027-09-10T09:00:00.000Z",
  ends_at: "2027-09-10T12:00:00.000Z"
};

describe("QuizController - CRUD routes", () => {
  let app: INestApplication;
  let quizService: ServiceStub;

  beforeEach(async () => {
    ({ app, quizService } = await buildApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /admin/quizzes answers 201 and passes the creator's id", async () => {
    await request(app.getHttpServer())
      .post("/admin/quizzes")
      .send(validQuiz)
      .expect(201);

    expect(quizService.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "TypeScript Foundations" }),
      "admin-1"
    );
  });

  it("POST /admin/quizzes answers 400 for a payload that fails validation", async () => {
    const response = await request(app.getHttpServer())
      .post("/admin/quizzes")
      .send({ ...validQuiz, duration_minutes: 0 })
      .expect(400);

    expect(response.body.message).toContain(
      "duration_minutes must be greater than 0"
    );
    expect(quizService.create).not.toHaveBeenCalled();
  });

  it("POST /admin/quizzes answers 400 for an unknown field", async () => {
    const response = await request(app.getHttpServer())
      .post("/admin/quizzes")
      .send({ ...validQuiz, created_by: "someone-else" })
      .expect(400);

    expect(response.body.message).toContain("property created_by should not exist");
    expect(quizService.create).not.toHaveBeenCalled();
  });

  it("GET /admin/quizzes answers 200", async () => {
    await request(app.getHttpServer()).get("/admin/quizzes").expect(200, []);
    expect(quizService.findAll).toHaveBeenCalled();
  });

  it("GET /admin/quizzes/:id answers 200", async () => {
    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1")
      .expect(200);
    expect(quizService.findOne).toHaveBeenCalledWith("quiz-1");
  });

  it("PUT /admin/quizzes/:id answers 200", async () => {
    await request(app.getHttpServer())
      .put("/admin/quizzes/quiz-1")
      .send({ ...validQuiz, status: "draft" })
      .expect(200);

    expect(quizService.update).toHaveBeenCalledWith(
      "quiz-1",
      expect.objectContaining({ status: "draft" })
    );
  });

  it("PUT /admin/quizzes/:id answers 400 when ends_at precedes starts_at", async () => {
    const response = await request(app.getHttpServer())
      .put("/admin/quizzes/quiz-1")
      .send({
        ...validQuiz,
        starts_at: "2027-09-10T12:00:00.000Z",
        ends_at: "2027-09-10T09:00:00.000Z"
      })
      .expect(400);

    expect(response.body.message).toContain("ends_at must be after starts_at");
    expect(quizService.update).not.toHaveBeenCalled();
  });

  it("DELETE /admin/quizzes/:id answers 200", async () => {
    await request(app.getHttpServer())
      .delete("/admin/quizzes/quiz-1")
      .expect(200, { message: "Quiz deleted successfully" });
    expect(quizService.remove).toHaveBeenCalledWith("quiz-1");
  });

  it("maps a missing quiz to 404", async () => {
    const { app: notFoundApp } = await buildApp({
      findOne: jest.fn(async () => {
        throw new NotFoundException("Quiz not found");
      }) as never
    });

    await request(notFoundApp.getHttpServer())
      .get("/admin/quizzes/missing")
      .expect(404, {
        message: "Quiz not found",
        error: "Not Found",
        statusCode: 404
      });
    await notFoundApp.close();
  });
});

describe("QuizController - publish routes", () => {
  it("POST /admin/quizzes/:id/publish answers 200, not 201", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/publish")
      .expect(200);

    expect(quizService.publish).toHaveBeenCalledWith("quiz-1");
    await app.close();
  });

  it("surfaces the publish gate as 400 with the service's message", async () => {
    const { app } = await buildApp({
      publish: jest.fn(async () => {
        throw new BadRequestException(
          "Add at least one question before publishing this quiz."
        );
      }) as never
    });

    await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/publish")
      .expect(400, {
        message: "Add at least one question before publishing this quiz.",
        error: "Bad Request",
        statusCode: 400
      });
    await app.close();
  });

  it("POST /admin/quizzes/:id/unpublish answers 200", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/unpublish")
      .expect(200);

    expect(quizService.unpublish).toHaveBeenCalledWith("quiz-1");
    await app.close();
  });
});

describe("QuizController - invitation routes", () => {
  it("POST invitations answers 200 with the per-recipient summary", async () => {
    const { app, quizService } = await buildApp();

    const response = await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/invitations")
      .send({ emails: ["avery@example.com"] })
      .expect(200);

    expect(response.body).toMatchObject({ sent: 1, failed: 0, invalid: 0 });
    expect(quizService.invite).toHaveBeenCalledWith("quiz-1", {
      emails: ["avery@example.com"]
    });
    await app.close();
  });

  it("POST invitations answers 400 when emails is not an array", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/invitations")
      .send({ emails: "avery@example.com" })
      .expect(400);

    expect(quizService.invite).not.toHaveBeenCalled();
    await app.close();
  });

  it("POST invitations answers 400 above the 100-recipient cap", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .post("/admin/quizzes/quiz-1/invitations")
      .send({
        emails: Array.from({ length: 101 }, (_, i) => `s${i}@example.com`)
      })
      .expect(400);

    expect(quizService.invite).not.toHaveBeenCalled();
    await app.close();
  });

  it("GET invitations answers 200", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1/invitations")
      .expect(200, []);

    expect(quizService.getQuizInvitations).toHaveBeenCalledWith("quiz-1");
    await app.close();
  });
});

describe("QuizController - reporting routes", () => {
  it("GET analytics answers 200", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .get("/admin/quizzes/analytics/quiz-1")
      .expect(200);

    expect(quizService.getQuizAnalytics).toHaveBeenCalledWith("quiz-1");
    await app.close();
  });

  it("accepts not_started as a student status filter", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1/students?status=not_started")
      .expect(200, []);

    expect(quizService.getQuizStudents).toHaveBeenCalledWith(
      "quiz-1",
      "not_started"
    );
    await app.close();
  });

  it("accepts a request with no status filter", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1/students")
      .expect(200, []);

    expect(quizService.getQuizStudents).toHaveBeenCalledWith(
      "quiz-1",
      undefined
    );
    await app.close();
  });

  it("rejects an unknown student status with 400", async () => {
    const { app, quizService } = await buildApp();

    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1/students?status=archived")
      .expect(400);

    expect(quizService.getQuizStudents).not.toHaveBeenCalled();
    await app.close();
  });
});
