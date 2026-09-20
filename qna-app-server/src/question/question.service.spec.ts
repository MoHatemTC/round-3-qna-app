import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { QuestionService, attemptQuestionSelect } from "./question.service.js";
import {
  AttemptStatus,
  QuestionType,
  QuizStatus,
  Role
} from "../generated/prisma/enums.js";
import { applySelect, findKeyPath } from "../testing/payload-scan.js";

// GET /quizzes/:id/questions/for-attempt is what a student loads while sitting
// the quiz. It must return the question text, type and options and must not
// carry is_correct anywhere in the payload.

const HOUR = 60 * 60 * 1000;

// Full rows as they sit in Postgres - answer key included. The fake Prisma
// below applies the service's `select` to them, so these tests exercise the
// select rather than a fixture that simply never held the flag.
const storedQuestions = [
  {
    id: "question-1",
    quiz_id: "quiz-1",
    type: QuestionType.mcq,
    text: "What is the capital of France?",
    points: 2,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    options: [
      { id: "opt-1", text: "Paris", is_correct: true, created_at: new Date(1) },
      { id: "opt-2", text: "Lyon", is_correct: false, created_at: new Date(2) },
      { id: "opt-3", text: "Nice", is_correct: false, created_at: new Date(3) }
    ]
  },
  {
    id: "question-2",
    quiz_id: "quiz-1",
    type: QuestionType.true_false,
    text: "TypeScript compiles to JavaScript.",
    points: 1,
    created_at: new Date("2026-01-02T00:00:00.000Z"),
    options: [
      { id: "opt-4", text: "true", is_correct: true, created_at: new Date(4) },
      { id: "opt-5", text: "false", is_correct: false, created_at: new Date(5) }
    ]
  }
];

function makeService({
  status = QuizStatus.published,
  attempt = { id: "attempt-1" } as { id: string } | null
} = {}) {
  const quiz = {
    id: "quiz-1",
    title: "JavaScript Fundamentals",
    duration_minutes: 30,
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR),
    status
  };
  const prisma = {
    quiz: { findUnique: jest.fn().mockResolvedValue(quiz) },
    attempt: { findFirst: jest.fn().mockResolvedValue(attempt) },
    question: {
      findMany: jest.fn(({ select }: any) =>
        Promise.resolve(storedQuestions.map((row) => applySelect(row, select)))
      )
    }
  };
  return { service: new QuestionService(prisma as any), prisma };
}

const student = { id: "student-1", role: Role.student };
const admin = { id: "admin-1", role: Role.admin };

describe("for-attempt questions never expose the answer key", () => {
  it("has no is_correct anywhere in the select itself", () => {
    expect(findKeyPath(attemptQuestionSelect, "is_correct")).toBeNull();
  });

  it("never asks the database for is_correct", async () => {
    const { service, prisma } = makeService();

    await service.findForAttempt("quiz-1", student);

    const [args] = prisma.question.findMany.mock.calls[0];
    expect(findKeyPath(args.select, "is_correct")).toBeNull();
  });

  it("returns no is_correct anywhere in a student's payload", async () => {
    const { service } = makeService();

    const questions = await service.findForAttempt("quiz-1", student);

    expect(findKeyPath(questions, "is_correct")).toBeNull();
    expect(JSON.stringify(questions)).not.toContain("is_correct");
  });

  it("returns no is_correct anywhere in an admin preview either", async () => {
    const { service } = makeService();

    const questions = await service.findForAttempt("quiz-1", admin);

    expect(findKeyPath(questions, "is_correct")).toBeNull();
  });

  it("still returns the text, type, points and options needed to answer", async () => {
    const { service } = makeService();

    const questions: any[] = await service.findForAttempt("quiz-1", student);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual({
      id: "question-1",
      type: QuestionType.mcq,
      text: "What is the capital of France?",
      points: 2,
      options: [
        { id: "opt-1", text: "Paris" },
        { id: "opt-2", text: "Lyon" },
        { id: "opt-3", text: "Nice" }
      ]
    });
    for (const option of questions[0].options) {
      expect(Object.keys(option).sort()).toEqual(["id", "text"]);
    }
  });

  it("keeps every option, so a correct answer is not identifiable by omission", async () => {
    const { service } = makeService();

    const questions: any[] = await service.findForAttempt("quiz-1", student);

    expect(questions[0].options).toHaveLength(3);
    expect(questions[1].options).toHaveLength(2);
  });
});

describe("for-attempt access rules", () => {
  it("403s a student with no attempt in progress", async () => {
    const { service, prisma } = makeService({ attempt: null });

    await expect(
      service.findForAttempt("quiz-1", student)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });

  it("404s a student on a quiz that is still a draft", async () => {
    const { service, prisma } = makeService({ status: QuizStatus.draft });

    await expect(
      service.findForAttempt("quiz-1", student)
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });

  it("lets an admin preview a draft quiz", async () => {
    const { service } = makeService({
      status: QuizStatus.draft,
      attempt: null
    });

    const questions = await service.findForAttempt("quiz-1", admin);

    expect(questions).toHaveLength(2);
    expect(findKeyPath(questions, "is_correct")).toBeNull();
  });

  it("only accepts an in-progress attempt", async () => {
    const { service, prisma } = makeService();

    await service.findForAttempt("quiz-1", student);

    expect(prisma.attempt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: AttemptStatus.in_progress })
      })
    );
  });
});
