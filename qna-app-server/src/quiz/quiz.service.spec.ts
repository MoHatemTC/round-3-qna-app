import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QuizService } from "./quiz.service.js";
import { QuestionType, QuizStatus } from "../generated/prisma/enums.js";

// Publish gate: POST /admin/quizzes/:id/publish must refuse a quiz that has no
// questions or a malformed one, and must move a quiz between draft and
// published only when it passes.

const HOUR = 60 * 60 * 1000;

function quizRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "quiz-1",
    title: "JavaScript Fundamentals",
    description: null,
    duration_minutes: 30,
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR),
    status: QuizStatus.draft,
    created_by: "admin-1",
    _count: { questions: 0, invitations: 0, attempts: 0 },
    ...overrides
  };
}

function mcq(correctCount: number, optionCount = 4) {
  return {
    text: "What is the capital of France?",
    type: QuestionType.mcq,
    options: Array.from({ length: optionCount }, (_, index) => ({
      is_correct: index < correctCount
    }))
  };
}

function makeService(quiz: Record<string, unknown> | null, questions: any[]) {
  const prisma = {
    quiz: {
      findUnique: jest.fn().mockResolvedValue(quiz),
      update: jest.fn(({ data }: any) => Promise.resolve({ ...quiz, ...data }))
    },
    question: { findMany: jest.fn().mockResolvedValue(questions) }
  };
  const notifications = { send: jest.fn() };
  const service = new QuizService(prisma as any, notifications as any);
  return { service, prisma };
}

// Runs `call` and returns its rejection instead of throwing, so a test can
// assert on both the exception type and the HTTP status the client actually
// receives. Takes a thunk because the guards that run before the first await
// (create, for one) throw synchronously.
async function rejection(call: () => unknown): Promise<any> {
  return Promise.resolve()
    .then(call)
    .then(
      () => {
        throw new Error("Expected the call to be rejected, but it resolved");
      },
      (error) => error
    );
}

describe("QuizService publish gate", () => {
  it("refuses to publish a quiz with no questions and leaves it in draft", async () => {
    const { service, prisma } = makeService(quizRow(), []);

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/at least one question/i);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("refuses to publish when an mcq question has no correct option", async () => {
    const { service, prisma } = makeService(quizRow(), [mcq(0)]);

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/question 1/);
    expect(error.message).toMatch(/exactly one correct option/i);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("refuses to publish when an mcq question has two correct options", async () => {
    const { service } = makeService(quizRow(), [mcq(2)]);

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/exactly one correct option/i);
  });

  it("refuses to publish when an mcq question has a single option", async () => {
    const { service } = makeService(quizRow(), [mcq(1, 1)]);

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/at least two options/i);
  });

  it("names every offending question, not just the first", async () => {
    const { service } = makeService(quizRow(), [mcq(1), mcq(0), mcq(2)]);

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error.message).toMatch(/question 2/);
    expect(error.message).toMatch(/question 3/);
  });

  it("refuses to publish a quiz whose end time has already passed", async () => {
    const { service, prisma } = makeService(
      quizRow({ ends_at: new Date(Date.now() - HOUR) }),
      [mcq(1)]
    );

    const error = await rejection(() => service.publish("quiz-1"));

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/end time/i);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("404s on a quiz that does not exist", async () => {
    const { service } = makeService(null, []);

    const error = await rejection(() => service.publish("nope"));

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.getStatus()).toBe(404);
  });

  it("moves a valid draft to published", async () => {
    const { service, prisma } = makeService(quizRow(), [mcq(1), mcq(1, 2)]);

    const published: any = await service.publish("quiz-1");

    expect(prisma.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-1" },
        data: { status: QuizStatus.published }
      })
    );
    expect(published.status).toBe(QuizStatus.published);
  });

  it("is a no-op when the quiz is already published", async () => {
    const { service, prisma } = makeService(
      quizRow({ status: QuizStatus.published }),
      [mcq(1)]
    );

    const quiz: any = await service.publish("quiz-1");

    expect(quiz.status).toBe(QuizStatus.published);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });
});

describe("QuizService draft/published lifecycle", () => {
  it("unpublish moves a published quiz back to draft", async () => {
    const { service, prisma } = makeService(
      quizRow({ status: QuizStatus.published }),
      [mcq(1)]
    );

    const quiz: any = await service.unpublish("quiz-1");

    expect(prisma.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-1" },
        data: { status: QuizStatus.draft }
      })
    );
    expect(quiz.status).toBe(QuizStatus.draft);
  });

  it("unpublish is a no-op on a quiz that is already a draft", async () => {
    const { service, prisma } = makeService(quizRow(), []);

    const quiz: any = await service.unpublish("quiz-1");

    expect(quiz.status).toBe(QuizStatus.draft);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("unpublish 404s on a quiz that does not exist", async () => {
    const { service } = makeService(null, []);

    const error = await rejection(() => service.unpublish("nope"));

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.getStatus()).toBe(404);
  });

  it("a new quiz cannot be created straight into published", async () => {
    const { service, prisma } = makeService(null, []);

    const error = await rejection(() =>
      service.create(
        {
          title: "Fresh quiz",
          duration_minutes: 30,
          starts_at: new Date(Date.now() + HOUR).toISOString(),
          ends_at: new Date(Date.now() + 2 * HOUR).toISOString(),
          status: QuizStatus.published
        } as any,
        "admin-1"
      )
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/at least one question/i);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("PUT cannot publish an empty quiz through the status field either", async () => {
    const { service, prisma } = makeService(quizRow(), []);

    const error = await rejection(() =>
      service.update("quiz-1", {
        title: "JavaScript Fundamentals",
        duration_minutes: 30,
        starts_at: new Date(Date.now() - HOUR).toISOString(),
        ends_at: new Date(Date.now() + HOUR).toISOString(),
        status: QuizStatus.published
      } as any)
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getStatus()).toBe(400);
    expect(error.message).toMatch(/at least one question/i);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });
});
