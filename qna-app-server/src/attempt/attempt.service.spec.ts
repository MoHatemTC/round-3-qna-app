import { AttemptService } from "./attempt.service.js";
import { QuestionService } from "../question/question.service.js";
import {
  AttemptStatus,
  QuestionType,
  QuizStatus
} from "../generated/prisma/enums.js";
import { applySelect, findKeyPath } from "../testing/payload-scan.js";

// POST /attempts/start hands the student their questions along with the
// attempt, so it is the second student-facing route that must not leak the
// answer key. Same rule as for-attempt: no is_correct anywhere in the payload.

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

// Stored with the answer key, exactly as Postgres holds it. The fake Prisma
// applies the service's `select`, so the assertions below test the select.
const storedQuestions = [
  {
    id: "question-1",
    quiz_id: "quiz-1",
    type: QuestionType.mcq,
    text: "What is the capital of France?",
    points: 2,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    options: [
      { id: "opt-1", text: "Paris", is_correct: true },
      { id: "opt-2", text: "Lyon", is_correct: false }
    ]
  }
];

function makeService({ running = null as any } = {}) {
  const quiz = {
    id: "quiz-1",
    title: "JavaScript Fundamentals",
    duration_minutes: 30,
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR),
    status: QuizStatus.published
  };

  const prisma = {
    quiz: { findUnique: jest.fn().mockResolvedValue(quiz) },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: "student-1", email: "student@example.com" })
    },
    quizInvitation: {
      findFirst: jest.fn().mockResolvedValue({ id: "invite-1", status: "sent" })
    },
    attempt: {
      // finalizeExpiredAttempts sweeps with findMany; nothing has expired here.
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(({ where }: any) =>
        Promise.resolve(
          where.status === AttemptStatus.in_progress ? running : null
        )
      ),
      create: jest.fn(({ data }: any) =>
        Promise.resolve({
          id: "attempt-new",
          started_at: new Date(),
          status: AttemptStatus.in_progress,
          score: null,
          percentage: null,
          submitted_at: null,
          ...data
        })
      )
    },
    question: {
      findMany: jest.fn(({ select }: any) =>
        Promise.resolve(storedQuestions.map((row) => applySelect(row, select)))
      )
    },
    $transaction: jest.fn()
  };

  const questionService = new QuestionService(prisma as any);
  const answerKeyService = { getAnswerKey: jest.fn() };
  const service = new AttemptService(
    prisma as any,
    questionService,
    answerKeyService as any
  );
  return { service, prisma, answerKeyService };
}

describe("starting an attempt never exposes the answer key", () => {
  it("returns questions with no is_correct anywhere", async () => {
    const { service } = makeService();

    const attempt: any = await service.start(
      { quiz_id: "quiz-1" } as any,
      "student-1"
    );

    expect(attempt.questions).toHaveLength(1);
    expect(findKeyPath(attempt, "is_correct")).toBeNull();
    expect(JSON.stringify(attempt)).not.toContain("is_correct");
  });

  it("returns the option text a student needs to answer", async () => {
    const { service } = makeService();

    const attempt: any = await service.start(
      { quiz_id: "quiz-1" } as any,
      "student-1"
    );

    expect(attempt.questions[0].options).toEqual([
      { id: "opt-1", text: "Paris" },
      { id: "opt-2", text: "Lyon" }
    ]);
  });

  it("hands back a server-side end time rather than trusting the client", async () => {
    const { service } = makeService();

    const attempt: any = await service.start(
      { quiz_id: "quiz-1" } as any,
      "student-1"
    );

    expect(attempt.end_time).toBeInstanceOf(Date);
    expect(attempt.end_time.getTime()).toBeGreaterThan(Date.now());
  });

  it("leaks nothing when resuming an attempt that is still running", async () => {
    const { service, prisma } = makeService({
      running: {
        id: "attempt-1",
        quiz_id: "quiz-1",
        user_id: "student-1",
        started_at: new Date(Date.now() - 5 * MINUTE),
        status: AttemptStatus.in_progress
      }
    });

    const attempt: any = await service.start(
      { quiz_id: "quiz-1" } as any,
      "student-1"
    );

    expect(attempt.id).toBe("attempt-1");
    expect(prisma.attempt.create).not.toHaveBeenCalled();
    expect(findKeyPath(attempt, "is_correct")).toBeNull();
  });

  it("does not touch the internal answer key while starting", async () => {
    const { service, answerKeyService } = makeService();

    await service.start({ quiz_id: "quiz-1" } as any, "student-1");

    expect(answerKeyService.getAnswerKey).not.toHaveBeenCalled();
  });
});
