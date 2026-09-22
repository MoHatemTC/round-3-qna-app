import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QuizService } from "./quiz.service.js";
import { AttemptStatus, QuestionType } from "../generated/prisma/enums.js";
import type { CreateQuizDto } from "./dto/create-quiz.dto.js";
import type { UpdateQuizDto } from "./dto/update-quiz.dto.js";

// The service is driven through a hand-rolled Prisma double: every test states
// exactly which rows the database holds, so the assertions are about the
// service's own rules rather than about a live schema.

// Prisma client methods all take one options object. The doubles have to
// declare it, or mock.calls[0][0] is typed as an empty tuple.
type DbArgs = any;

const HOUR = 60 * 60 * 1000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

type QuizRow = {
  id: string;
  title?: string;
  status?: string;
  starts_at?: Date;
  ends_at?: Date;
  _count?: { questions: number; invitations: number; attempts: number };
};

type StoredQuestion = {
  text: string;
  type: QuestionType;
  options: { is_correct: boolean }[];
};

function buildPrisma({
  quiz,
  questions = []
}: {
  quiz?: QuizRow | null;
  questions?: StoredQuestion[];
} = {}) {
  return {
    quiz: {
      create: jest.fn(async ({ data }: any) => ({ id: "new-quiz", ...data })),
      findMany: jest.fn(async (_args?: DbArgs) => (quiz ? [quiz] : [])),
      findUnique: jest.fn(async () => quiz ?? null),
      update: jest.fn(async ({ where, data }: any) => ({
        ...quiz,
        ...data,
        id: where.id
      })),
      delete: jest.fn(async (_args?: DbArgs) => quiz)
    },
    question: {
      findMany: jest.fn(async (_args?: DbArgs) => questions)
    },
    quizInvitation: {
      findMany: jest.fn(async (_args?: DbArgs) => [] as unknown[]),
      findUnique: jest.fn(async () => null as unknown),
      create: jest.fn(async ({ data }: any) => ({ id: "inv-1", ...data })),
      update: jest.fn(async ({ data }: any) => ({ id: "inv-1", ...data })),
      count: jest.fn(async () => 0)
    },
    user: {
      findMany: jest.fn(async () => [] as unknown[]),
      findUnique: jest.fn(async () => null as unknown)
    },
    attempt: {
      findMany: jest.fn(async (_args?: DbArgs) => [] as unknown[]),
      count: jest.fn(async () => 0),
      aggregate: jest.fn(async () => ({
        _avg: { percentage: null as number | null }
      }))
    }
  };
}

function buildService(options?: Parameters<typeof buildPrisma>[0]) {
  const prisma = buildPrisma(options);
  const notifications = { send: jest.fn(async () => undefined) };
  const service = new QuizService(prisma as never, notifications as never);
  return { service, prisma, notifications };
}

const mcqQuestion = (correctCount = 1): StoredQuestion => ({
  text: "Which keyword creates a type alias?",
  type: QuestionType.mcq,
  options: [{ is_correct: correctCount > 0 }, { is_correct: correctCount > 1 }]
});

const validDto = (overrides: Partial<CreateQuizDto> = {}): CreateQuizDto =>
  ({
    title: "TypeScript Foundations",
    description: "Types, narrowing and generics.",
    duration_minutes: 35,
    starts_at: iso(HOUR),
    ends_at: iso(4 * HOUR),
    ...overrides
  }) as CreateQuizDto;

const publishedQuiz = (overrides: Partial<QuizRow> = {}): QuizRow => ({
  id: "quiz-1",
  title: "TypeScript Foundations",
  status: "published",
  starts_at: new Date(Date.now() + HOUR),
  ends_at: new Date(Date.now() + 4 * HOUR),
  _count: { questions: 10, invitations: 5, attempts: 0 },
  ...overrides
});

const draftQuiz = (overrides: Partial<QuizRow> = {}): QuizRow =>
  publishedQuiz({ status: "draft", ...overrides });

describe("QuizService - create", () => {
  it("stores a draft quiz and returns it with its counts", async () => {
    const { service, prisma } = buildService();

    const created = await service.create(validDto(), "admin-1");

    const args = prisma.quiz.create.mock.calls[0][0] as any;
    expect(args.data.title).toBe("TypeScript Foundations");
    expect(args.data.duration_minutes).toBe(35);
    expect(args.data.created_by).toBe("admin-1");
    expect(args.data.status).toBe("draft");
    expect(args.data.starts_at).toBeInstanceOf(Date);
    expect(args.include._count.select).toEqual({
      questions: true,
      invitations: true,
      attempts: true
    });
    expect(created.status).toBe("draft");
  });

  it("refuses to create a quiz that is already published", async () => {
    const { service, prisma } = buildService();

    // A brand-new quiz has no questions, so publishing it would skip the gate.
    await expect(
      service.create(validDto({ status: "published" as never }), "admin-1")
    ).rejects.toThrow("Add at least one question before publishing this quiz.");
    expect(prisma.quiz.create).not.toHaveBeenCalled();
  });

  it("refuses an end time that has already passed", async () => {
    const { service, prisma } = buildService();

    await expect(
      service.create(
        validDto({ starts_at: iso(-4 * HOUR), ends_at: iso(-HOUR) }),
        "admin-1"
      )
    ).rejects.toThrow("The end time must be in the future.");
    expect(prisma.quiz.create).not.toHaveBeenCalled();
  });

  it("refuses a duration longer than the window", async () => {
    const { service, prisma } = buildService();

    await expect(
      service.create(
        validDto({
          duration_minutes: 240,
          starts_at: iso(HOUR),
          ends_at: iso(2 * HOUR)
        }),
        "admin-1"
      )
    ).rejects.toThrow(/longer than the quiz window \(60 min\)/);
    expect(prisma.quiz.create).not.toHaveBeenCalled();
  });

  it("allows a duration exactly equal to the window", async () => {
    const { service, prisma } = buildService();

    await service.create(
      validDto({
        duration_minutes: 60,
        starts_at: iso(HOUR),
        ends_at: iso(2 * HOUR)
      }),
      "admin-1"
    );

    expect(prisma.quiz.create).toHaveBeenCalled();
  });
});

describe("QuizService - read", () => {
  it("lists quizzes newest first with their counts", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });

    await service.findAll();

    const args = prisma.quiz.findMany.mock.calls[0][0] as any;
    expect(args.orderBy).toEqual({ created_at: "desc" });
    expect(args.include._count.select.questions).toBe(true);
  });

  it("returns a single quiz", async () => {
    const { service } = buildService({ quiz: publishedQuiz() });

    await expect(service.findOne("quiz-1")).resolves.toMatchObject({
      id: "quiz-1"
    });
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.findOne("missing")).rejects.toThrow(NotFoundException);
  });
});

describe("QuizService - update", () => {
  it("replaces every field and coerces the dates", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.update("quiz-1", {
      ...validDto({ title: "Renamed", duration_minutes: 20 }),
      status: "draft"
    } as UpdateQuizDto);

    const args = prisma.quiz.update.mock.calls[0][0] as any;
    expect(args.where).toEqual({ id: "quiz-1" });
    expect(args.data.title).toBe("Renamed");
    expect(args.data.duration_minutes).toBe(20);
    expect(args.data.starts_at).toBeInstanceOf(Date);
    expect(args.data.ends_at).toBeInstanceOf(Date);
  });

  it("raises 404 before touching the row when the quiz is missing", async () => {
    const { service, prisma } = buildService({ quiz: null });

    await expect(
      service.update("missing", validDto() as UpdateQuizDto)
    ).rejects.toThrow(NotFoundException);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("still enforces the duration-vs-window rule", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await expect(
      service.update(
        "quiz-1",
        validDto({
          duration_minutes: 500,
          starts_at: iso(HOUR),
          ends_at: iso(2 * HOUR)
        }) as UpdateQuizDto
      )
    ).rejects.toThrow(BadRequestException);
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("runs the publish gate when a draft is promoted to published", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      questions: []
    });

    await expect(
      service.update("quiz-1", {
        ...validDto(),
        status: "published"
      } as UpdateQuizDto)
    ).rejects.toThrow("Add at least one question before publishing this quiz.");
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("promotes a draft with valid questions to published", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      questions: [mcqQuestion()]
    });

    await service.update("quiz-1", {
      ...validDto(),
      status: "published"
    } as UpdateQuizDto);

    const args = prisma.quiz.update.mock.calls[0][0] as any;
    expect(args.data.status).toBe("published");
  });

  it("does not re-run the gate for a quiz that is already published", async () => {
    const { service, prisma } = buildService({
      quiz: publishedQuiz(),
      questions: []
    });

    await service.update("quiz-1", {
      ...validDto(),
      status: "published"
    } as UpdateQuizDto);

    expect(prisma.question.findMany).not.toHaveBeenCalled();
    expect(prisma.quiz.update).toHaveBeenCalled();
  });

  it("refuses to publish through update when the end time has passed", async () => {
    const { service } = buildService({
      quiz: draftQuiz(),
      questions: [mcqQuestion()]
    });

    await expect(
      service.update("quiz-1", {
        ...validDto({
          duration_minutes: 30,
          starts_at: iso(-4 * HOUR),
          ends_at: iso(-HOUR)
        }),
        status: "published"
      } as UpdateQuizDto)
    ).rejects.toThrow(/end time has already passed/);
  });
});

describe("QuizService - remove", () => {
  it("deletes an existing quiz", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await expect(service.remove("quiz-1")).resolves.toEqual({
      message: "Quiz deleted successfully"
    });
    expect(prisma.quiz.delete).toHaveBeenCalledWith({
      where: { id: "quiz-1" }
    });
  });

  it("raises 404 without deleting when the quiz is missing", async () => {
    const { service, prisma } = buildService({ quiz: null });

    await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    expect(prisma.quiz.delete).not.toHaveBeenCalled();
  });
});

describe("QuizService - publish gate", () => {
  it("refuses a quiz with no questions", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      questions: []
    });

    await expect(service.publish("quiz-1")).rejects.toThrow(
      "Add at least one question before publishing this quiz."
    );
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("publishes a quiz whose questions are all well-formed", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      questions: [mcqQuestion(), mcqQuestion()]
    });

    const published = await service.publish("quiz-1");

    expect(published.status).toBe("published");
    expect(prisma.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-1" },
        data: { status: "published" }
      })
    );
  });

  it("names the offending question when one is malformed", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      // The second question has two correct options.
      questions: [mcqQuestion(), mcqQuestion(2)]
    });

    await expect(service.publish("quiz-1")).rejects.toThrow(
      "Fix these questions before publishing: question 2 (mcq questions need exactly one correct option)"
    );
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("lists every malformed question, not just the first", async () => {
    const { service } = buildService({
      quiz: draftQuiz(),
      questions: [
        mcqQuestion(0),
        mcqQuestion(),
        {
          text: "strict mode enables strictNullChecks.",
          type: QuestionType.true_false,
          options: [{ is_correct: true }, { is_correct: true }]
        }
      ]
    });

    await expect(service.publish("quiz-1")).rejects.toThrow(
      /question 1 \(mcq questions need exactly one correct option\); question 3 \(true_false questions need exactly one correct value\)/
    );
  });

  it("checks stored questions in creation order so the numbering matches the UI", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      questions: [mcqQuestion()]
    });

    await service.publish("quiz-1");

    const args = prisma.question.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({ quiz_id: "quiz-1" });
    expect(args.orderBy).toEqual({ created_at: "asc" });
  });

  it("refuses a quiz whose end time has already passed", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz({
        starts_at: new Date(Date.now() - 4 * HOUR),
        ends_at: new Date(Date.now() - HOUR)
      }),
      questions: [mcqQuestion()]
    });

    await expect(service.publish("quiz-1")).rejects.toThrow(
      "This quiz's end time has already passed. Set a later end time before publishing."
    );
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("is a no-op for a quiz that is already published", async () => {
    const { service, prisma } = buildService({
      quiz: publishedQuiz(),
      questions: []
    });

    const result = await service.publish("quiz-1");

    expect(result.status).toBe("published");
    expect(prisma.question.findMany).not.toHaveBeenCalled();
    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.publish("missing")).rejects.toThrow(NotFoundException);
  });
});

describe("QuizService - unpublish", () => {
  it("moves a published quiz back to draft", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });

    const result = await service.unpublish("quiz-1");

    expect(result.status).toBe("draft");
    expect(prisma.quiz.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "draft" } })
    );
  });

  it("is a no-op for a quiz that is already a draft", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.unpublish("quiz-1");

    expect(prisma.quiz.update).not.toHaveBeenCalled();
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.unpublish("missing")).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("QuizService - invite", () => {
  it("refuses to invite students to a draft quiz", async () => {
    const { service, notifications } = buildService({ quiz: draftQuiz() });

    await expect(
      service.invite("quiz-1", { emails: ["avery@example.com"] })
    ).rejects.toThrow("Only published quizzes can receive invitations");
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it("refuses to invite students to a quiz that has ended", async () => {
    const { service, notifications } = buildService({
      quiz: publishedQuiz({
        starts_at: new Date(Date.now() - 4 * HOUR),
        ends_at: new Date(Date.now() - HOUR)
      })
    });

    await expect(
      service.invite("quiz-1", { emails: ["avery@example.com"] })
    ).rejects.toThrow(/already ended/);
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it("sends one invitation per unique address, case-insensitively", async () => {
    const { service, notifications } = buildService({ quiz: publishedQuiz() });

    const summary = await service.invite("quiz-1", {
      emails: ["Avery@Example.com", "avery@example.com", " avery@example.com "]
    });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({
      sent: 1,
      failed: 0,
      skipped: 0,
      invalid: 0
    });
  });

  it("reports a malformed address as invalid rather than as a delivery failure", async () => {
    const { service, notifications } = buildService({ quiz: publishedQuiz() });

    const summary = await service.invite("quiz-1", {
      emails: ["avery@example.com", "not-an-email"]
    });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ sent: 1, failed: 0, invalid: 1 });
    expect(summary.invalid_emails).toEqual(["not-an-email"]);
  });

  it("records a delivery failure with the mail server's own reason", async () => {
    const { service, notifications, prisma } = buildService({
      quiz: publishedQuiz()
    });
    notifications.send.mockRejectedValue(
      new Error("550 5.1.1 Recipient address rejected") as never
    );

    const summary = await service.invite("quiz-1", {
      emails: ["avery@example.com"]
    });

    expect(summary).toMatchObject({ sent: 0, failed: 1 });
    expect(summary.failures).toEqual([
      {
        email: "avery@example.com",
        reason: "550 5.1.1 Recipient address rejected"
      }
    ]);
    expect(prisma.quizInvitation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "failed" } })
    );
  });

  it("only stamps sent_at once the email has gone out", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });

    await service.invite("quiz-1", { emails: ["avery@example.com"] });

    const created = prisma.quizInvitation.create.mock.calls[0][0] as any;
    expect(created.data.sent_at).toBeNull();
    const stamped = prisma.quizInvitation.update.mock.calls[0][0] as any;
    expect(stamped.data.sent_at).toBeInstanceOf(Date);
  });

  it("skips an address that already has a live invitation", async () => {
    const { service, prisma, notifications } = buildService({
      quiz: publishedQuiz()
    });
    prisma.quizInvitation.findUnique.mockResolvedValue({
      id: "inv-existing",
      status: "sent"
    } as never);

    const summary = await service.invite("quiz-1", {
      emails: ["avery@example.com"]
    });

    expect(summary).toMatchObject({ sent: 0, skipped: 1, failed: 0 });
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it("retries an invitation that previously failed", async () => {
    const { service, prisma, notifications } = buildService({
      quiz: publishedQuiz()
    });
    prisma.quizInvitation.findUnique.mockResolvedValue({
      id: "inv-existing",
      status: "failed"
    } as never);

    const summary = await service.invite("quiz-1", {
      emails: ["avery@example.com"]
    });

    expect(summary).toMatchObject({ sent: 1, skipped: 0 });
    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

  it("reports userIds that match no user instead of silently dropping them", async () => {
    const { service, notifications } = buildService({ quiz: publishedQuiz() });

    const summary = await service.invite("quiz-1", {
      userIds: ["ghost-1", "ghost-2"]
    });

    expect(notifications.send).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      sent: 0,
      invalid: 2,
      unresolved_user_ids: 2
    });
  });

  it("does not mutate the caller's emails array while resolving userIds", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.user.findMany.mockResolvedValue([
      { id: "user-1", email: "jordan@example.com" }
    ] as never);
    const dto = { emails: ["avery@example.com"], userIds: ["user-1"] };

    await service.invite("quiz-1", dto);

    expect(dto.emails).toEqual(["avery@example.com"]);
  });
});

describe("QuizService - analytics", () => {
  it("reports zero completion and no average when nobody is invited", async () => {
    const { service } = buildService({ quiz: publishedQuiz() });

    await expect(service.getQuizAnalytics("quiz-1")).resolves.toEqual({
      quiz_id: "quiz-1",
      invited_count: 0,
      started_count: 0,
      submitted_count: 0,
      completion_rate: 0,
      average_score: null
    });
  });

  it("derives the completion rate from submitted attempts over invitations", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.quizInvitation.count.mockResolvedValue(4 as never);
    prisma.attempt.count
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(2 as never);
    prisma.attempt.aggregate.mockResolvedValue({
      _avg: { percentage: 70 }
    } as never);

    await expect(service.getQuizAnalytics("quiz-1")).resolves.toMatchObject({
      invited_count: 4,
      started_count: 3,
      submitted_count: 2,
      completion_rate: 50,
      average_score: 70
    });
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.getQuizAnalytics("missing")).rejects.toThrow(
      NotFoundException
    );
  });
});

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
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.quizInvitation.findMany.mockResolvedValue([
      {
        email: "started@example.com",
        user: {
          id: "user-1",
          name: "Started Student",
          email: "started@example.com"
        }
      },
      { email: "new@example.com", user: null }
    ] as never);
    prisma.attempt.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        status: AttemptStatus.in_progress,
        score: null,
        percentage: null,
        created_at: new Date(),
        user: { name: "Started Student", email: "started@example.com" }
      }
    ] as never);

    const students = await service.getQuizStudents("quiz-1", "not_started");

    // not_started is computed, not stored, so the query cannot filter on it.
    const attemptQuery = prisma.attempt.findMany.mock.calls[0][0] as any;
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

  it("reports an invited student's score once they have submitted", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.quizInvitation.findMany.mockResolvedValue([
      {
        email: "avery@example.com",
        user: { id: "user-1", name: "Avery Morgan", email: "avery@example.com" }
      }
    ] as never);
    prisma.attempt.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        status: AttemptStatus.submitted,
        score: 8,
        percentage: 80,
        created_at: new Date(),
        user: { name: "Avery Morgan", email: "avery@example.com" }
      }
    ] as never);

    await expect(service.getQuizStudents("quiz-1")).resolves.toEqual([
      {
        name: "Avery Morgan",
        email: "avery@example.com",
        score: 8,
        percentage: 80,
        status: "submitted"
      }
    ]);
  });

  it("matches a guest invitation to an attempt by email", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.quizInvitation.findMany.mockResolvedValue([
      { email: "guest@example.com", user: null }
    ] as never);
    prisma.attempt.findMany.mockResolvedValue([
      {
        user_id: "user-9",
        status: AttemptStatus.auto_submitted,
        score: 6,
        percentage: 60,
        created_at: new Date(),
        user: { name: "Late Signup", email: "guest@example.com" }
      }
    ] as never);

    await expect(service.getQuizStudents("quiz-1")).resolves.toEqual([
      {
        name: null,
        email: "guest@example.com",
        score: 6,
        percentage: 60,
        status: "auto_submitted"
      }
    ]);
  });

  it("returns every student when no status filter is given", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });
    prisma.quizInvitation.findMany.mockResolvedValue([
      { email: "a@example.com", user: null },
      { email: "b@example.com", user: null }
    ] as never);

    await expect(service.getQuizStudents("quiz-1")).resolves.toHaveLength(2);
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.getQuizStudents("missing")).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("QuizService - invitation list", () => {
  it("returns invitations newest first with their linked account", async () => {
    const { service, prisma } = buildService({ quiz: publishedQuiz() });

    await service.getQuizInvitations("quiz-1");

    const args = prisma.quizInvitation.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({ quiz_id: "quiz-1" });
    expect(args.orderBy).toEqual({ created_at: "desc" });
    expect(args.select.user.select).toEqual({
      id: true,
      name: true,
      email: true
    });
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.getQuizInvitations("missing")).rejects.toThrow(
      NotFoundException
    );
  });
});
