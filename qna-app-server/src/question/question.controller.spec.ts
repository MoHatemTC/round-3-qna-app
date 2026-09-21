import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  NotFoundException,
  ValidationPipe
} from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { QuestionController } from "./question.controller.js";
import { QuestionService } from "./question.service.js";

// Covers the nested question routes over the same global ValidationPipe the
// real app installs: the field-level rejections happen in the pipe, and the
// mcq/true_false option rules come back from the service as 400s.

type StubFn = (...args: any[]) => any;
type ServiceStub = Record<string, jest.Mock<StubFn>>;

async function buildApp(overrides: Partial<ServiceStub> = {}) {
  const questionService: ServiceStub = {
    findAll: jest.fn(async () => []),
    create: jest.fn(async () => ({ id: "question-1" })),
    update: jest.fn(async () => ({ id: "question-1" })),
    remove: jest.fn(async () => ({ message: "Question deleted successfully" })),
    ...overrides
  } as ServiceStub;

  const module = await Test.createTestingModule({
    controllers: [QuestionController],
    providers: [{ provide: QuestionService, useValue: questionService }]
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  await app.init();
  return { app, questionService };
}

const validQuestion = {
  type: "mcq",
  text: "What is the capital of France?",
  points: 1,
  options: [
    { text: "Paris", is_correct: true },
    { text: "Lyon", is_correct: false }
  ]
};

const base = "/admin/quizzes/quiz-1/questions";

describe("QuestionController", () => {
  let app: INestApplication;
  let questionService: ServiceStub;

  beforeEach(async () => {
    ({ app, questionService } = await buildApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET answers 200 with the quiz id from the path", async () => {
    await request(app.getHttpServer()).get(base).expect(200, []);
    expect(questionService.findAll).toHaveBeenCalledWith("quiz-1");
  });

  it("POST answers 201 and forwards the quiz id and payload", async () => {
    await request(app.getHttpServer())
      .post(base)
      .send(validQuestion)
      .expect(201);

    expect(questionService.create).toHaveBeenCalledWith(
      "quiz-1",
      expect.objectContaining({ text: "What is the capital of France?" })
    );
  });

  it("POST answers 201 for a true_false question", async () => {
    await request(app.getHttpServer())
      .post(base)
      .send({
        ...validQuestion,
        type: "true_false",
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false }
        ]
      })
      .expect(201);
  });

  it("PUT answers 200 and forwards both path ids", async () => {
    await request(app.getHttpServer())
      .put(`${base}/question-1`)
      .send(validQuestion)
      .expect(200);

    expect(questionService.update).toHaveBeenCalledWith(
      "quiz-1",
      "question-1",
      expect.objectContaining({ type: "mcq" })
    );
  });

  it("DELETE answers 200", async () => {
    await request(app.getHttpServer())
      .delete(`${base}/question-1`)
      .expect(200, { message: "Question deleted successfully" });

    expect(questionService.remove).toHaveBeenCalledWith("quiz-1", "question-1");
  });
});

describe("QuestionController - request validation", () => {
  let app: INestApplication;
  let questionService: ServiceStub;

  beforeEach(async () => {
    ({ app, questionService } = await buildApp());
  });

  afterEach(async () => {
    await app.close();
  });

  const rejects = async (payload: unknown, expected: string) => {
    const response = await request(app.getHttpServer())
      .post(base)
      .send(payload as object)
      .expect(400);

    expect(response.body.message.join(" | ")).toContain(expected);
    // Nothing reaches the service when the payload is malformed.
    expect(questionService.create).not.toHaveBeenCalled();
  };

  it("rejects an unknown question type", async () => {
    await rejects(
      { ...validQuestion, type: "essay" },
      "type must be one of the following values: mcq, true_false"
    );
  });

  it("rejects blank question text", async () => {
    await rejects(
      { ...validQuestion, text: "" },
      "text must be longer than or equal to 1 characters"
    );
  });

  it("rejects zero points", async () => {
    await rejects(
      { ...validQuestion, points: 0 },
      "points must be greater than 0"
    );
  });

  it("rejects an empty options array", async () => {
    await rejects(
      { ...validQuestion, options: [] },
      "options must contain at least 1 elements"
    );
  });

  it("rejects an option with a non-boolean is_correct", async () => {
    await rejects(
      {
        ...validQuestion,
        options: [
          { text: "Paris", is_correct: "yes" },
          { text: "Lyon", is_correct: false }
        ]
      },
      "is_correct must be a boolean value"
    );
  });

  it("rejects an unknown field so a client cannot set quiz_id", async () => {
    await rejects(
      { ...validQuestion, quiz_id: "another-quiz" },
      "property quiz_id should not exist"
    );
  });
});

describe("QuestionController - error mapping", () => {
  it("returns 400 with the option-rule message from the service", async () => {
    const { app } = await buildApp({
      create: jest.fn(async () => {
        throw new BadRequestException("mcq questions need at least two options");
      }) as never
    });

    await request(app.getHttpServer())
      .post(base)
      .send(validQuestion)
      .expect(400, {
        message: "mcq questions need at least two options",
        error: "Bad Request",
        statusCode: 400
      });
    await app.close();
  });

  it("returns 400 with the lock message while the quiz is live", async () => {
    const { app } = await buildApp({
      create: jest.fn(async () => {
        throw new BadRequestException(
          "This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes."
        );
      }) as never
    });

    const response = await request(app.getHttpServer())
      .post(base)
      .send(validQuestion)
      .expect(400);

    expect(response.body.message).toContain("live right now");
    await app.close();
  });

  it("returns 404 for a quiz that does not exist", async () => {
    const { app } = await buildApp({
      findAll: jest.fn(async () => {
        throw new NotFoundException("Quiz not found");
      }) as never
    });

    await request(app.getHttpServer()).get(base).expect(404, {
      message: "Quiz not found",
      error: "Not Found",
      statusCode: 404
    });
    await app.close();
  });

  it("returns 404 for a question the quiz does not own", async () => {
    const { app } = await buildApp({
      update: jest.fn(async () => {
        throw new NotFoundException("Question not found");
      }) as never
    });

    await request(app.getHttpServer())
      .put(`${base}/someone-elses-question`)
      .send(validQuestion)
      .expect(404, {
        message: "Question not found",
        error: "Not Found",
        statusCode: 404
      });
    await app.close();
  });
});
