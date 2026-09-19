import { describe, expect, it, jest } from "@jest/globals";
import { QuizService } from "./quiz.service.js";
import { AttemptStatus } from "../generated/prisma/enums.js";

describe("QuizService", () => {
  it("filters computed not_started students after loading all attempts", async () => {
    const prisma = {
      quiz: {
        findUnique: jest
          .fn<() => Promise<{ id: string }>>()
          .mockResolvedValue({ id: "quiz-1" })
      },
      quizInvitation: {
        findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([
          {
            email: "started@example.com",
            user: {
              id: "user-1",
              name: "Started Student",
              email: "started@example.com"
            }
          },
          {
            email: "new@example.com",
            user: null
          }
        ])
      },
      attempt: {
        findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([
          {
            user_id: "user-1",
            status: AttemptStatus.in_progress,
            score: null,
            percentage: null,
            created_at: new Date(),
            user: { name: "Started Student", email: "started@example.com" }
          }
        ])
      }
    };
    const service = new QuizService(prisma as never, {} as never);

    const students = await service.getQuizStudents("quiz-1", "not_started");

    const attemptQuery = (prisma.attempt.findMany as unknown as {
      mock: { calls: unknown[][] };
    }).mock.calls[0][0] as { where: Record<string, unknown> };
    expect(attemptQuery.where).toEqual({ quiz_id: "quiz-1" });
    expect(students).toEqual([
      {
        name: null,
        email: "new@example.com",
        score: null,
        percentage: null,
        status: "not_started"
      }
    ]);
  });
});