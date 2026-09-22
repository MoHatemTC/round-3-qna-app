import { describe, expect, it, jest } from "@jest/globals";
import { QuizService } from "./quiz.service.js";
import { AttemptStatus } from "../generated/prisma/enums.js";

describe("QuizService", () => {
  it("continues the invitation batch when recording a failure cannot be written", async () => {
    const prisma = {
      quiz: {
        findUnique: jest.fn().mockResolvedValue({
          id: "quiz-1",
          ends_at: new Date(Date.now() + 60_000),
          status: "published",
          title: "Quiz",
          duration_minutes: 30
        })
      },
      emailDeliveryLog: {
        create: jest.fn().mockRejectedValue(new Error("database unavailable"))
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null)
      },
      quizInvitation: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "invitation-1" })
      }
    };
    const notifications = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new QuizService(prisma as never, notifications as never);

    const result = await service.invite("quiz-1", {
      emails: ["not-an-email", "valid@example.com"]
    });

    expect(result).toEqual({
      sent: 1,
      failed: 1,
      skipped: 0,
      failedEmails: [{ email: "not-an-email", reason: "Invalid email address" }]
    });
    expect(prisma.emailDeliveryLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ related_id: "quiz-1" })
    });
    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

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