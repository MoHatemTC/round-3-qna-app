import { describe, expect, it, jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { QuizController } from "./quiz.controller.js";
import { QuizService } from "./quiz.service.js";

describe("QuizController", () => {
  it("accepts not_started as a student status filter", async () => {
    const quizService = {
      getQuizStudents: jest.fn().mockResolvedValue([])
    };
    const module = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [{ provide: QuizService, useValue: quizService }]
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/admin/quizzes/quiz-1/students?status=not_started")
      .expect(200)
      .expect([]);

    expect(quizService.getQuizStudents).toHaveBeenCalledWith(
      "quiz-1",
      "not_started"
    );
    await app.close();
  });
});
