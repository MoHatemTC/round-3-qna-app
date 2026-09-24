import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from "@nestjs/common";
import { QuestionBankService } from "./question-bank.service.js";
import { QuestionType } from "../generated/prisma/enums.js";
import type { CreateQuestionDto } from "./dto/create-question.dto.js";

// The question bank: search/filter, and the delete rules - soft delete only,
// refused while a published quiz still needs the question unless forced, and
// never allowed to pull a question out from under a live quiz.

type DbArgs = any;

const HOUR = 60 * 60 * 1000;

type QuizRow = {
  id: string;
  title: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
};

const quiz = (
  id: string,
  kind: "draft" | "upcoming" | "live" | "ended"
): QuizRow => {
  const now = Date.now();
  const windows = {
    draft: [now + HOUR, now + 4 * HOUR],
    upcoming: [now + HOUR, now + 4 * HOUR],
    live: [now - HOUR, now + HOUR],
    ended: [now - 4 * HOUR, now - HOUR]
  };
  return {
    id,
    title: `Quiz ${id}`,
    status: kind === "draft" ? "draft" : "published",
    starts_at: new Date(windows[kind][0]),
    ends_at: new Date(windows[kind][1])
  };
};

function buildService({
  quizzes = [] as QuizRow[],
  isActive = true,
  exists = true,
  questionCounts = {} as Record<string, number>
} = {}) {
  const question = exists
    ? {
        id: "question-1",
        is_active: isActive,
        options: [],
        quizzes: quizzes.map((q, position) => ({ position, quiz: q }))
      }
    : null;

  const prisma: any = {
    question: {
      findUnique: jest.fn(async (_args?: DbArgs) => question),
      findMany: jest.fn(async (_args?: DbArgs) => []),
      count: jest.fn(async (_args?: DbArgs) => 0),
      create: jest.fn(async ({ data }: any) => ({
        id: "question-new",
        ...data
      })),
      update: jest.fn(async (args: DbArgs) => args)
    },
    quizQuestion: {
      groupBy: jest.fn(async ({ where }: any) =>
        where.quiz_id.in.map((quizId: string) => ({
          quiz_id: quizId,
          _count: { _all: questionCounts[quizId] ?? 5 }
        }))
      ),
      deleteMany: jest.fn(async (args: DbArgs) => args)
    },
    $transaction: jest.fn(async (arg: any) =>
      typeof arg === "function" ? arg(prisma) : Promise.all(arg)
    )
  };
  return { service: new QuestionBankService(prisma as never), prisma };
}

const mcqDto = (
  overrides: Partial<CreateQuestionDto> = {}
): CreateQuestionDto =>
  ({
    type: QuestionType.mcq,
    text: "What is the capital of France?",
    points: 1,
    options: [
      { text: "Paris", is_correct: true },
      { text: "Lyon", is_correct: false }
    ],
    ...overrides
  }) as CreateQuestionDto;

describe("QuestionBankService - create", () => {
  it("stores the question without any quiz, credited to its author", async () => {
    const { service, prisma } = buildService();

    await service.create(
      mcqDto({ category: "  Geography ", difficulty: "hard" as never }),
      "admin-1"
    );

    const args = prisma.question.create.mock.calls[0][0] as any;
    expect(args.data.created_by).toBe("admin-1");
    expect(args.data.category).toBe("Geography");
    expect(args.data.difficulty).toBe("hard");
    expect(args.data).not.toHaveProperty("quizzes");
  });

  it("rejects malformed options before writing", async () => {
    const { service, prisma } = buildService();

    await expect(
      service.create(mcqDto({ options: [] }), "admin-1")
    ).rejects.toThrow(BadRequestException);
    expect(prisma.question.create).not.toHaveBeenCalled();
  });
});

describe("QuestionBankService - list", () => {
  it("only returns active questions by default", async () => {
    const { service, prisma } = buildService();

    const page = await service.list({});

    const args = prisma.question.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({ is_active: true });
    expect(args.skip).toBe(0);
    expect(args.take).toBe(20);
    expect(page).toEqual({ items: [], total: 0, page: 1, page_size: 20 });
  });

  it("combines every filter into one query", async () => {
    const { service, prisma } = buildService();

    await service.list({
      search: " capital ",
      type: QuestionType.mcq,
      difficulty: "easy" as never,
      category: "Geography",
      tags: ["Europe", "capitals"],
      created_from: "2026-09-01",
      created_to: "2026-09-30",
      exclude_quiz_id: "quiz-1",
      page: 3,
      page_size: 10
    });

    const args = prisma.question.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({
      is_active: true,
      text: { contains: "capital", mode: "insensitive" },
      type: "mcq",
      difficulty: "easy",
      category: { equals: "Geography", mode: "insensitive" },
      tags: { hasSome: ["europe", "capitals"] },
      created_at: {
        gte: new Date("2026-09-01"),
        // Through the end of the 30th.
        lt: new Date("2026-10-01")
      },
      quizzes: { none: { quiz_id: "quiz-1" } }
    });
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });
});

describe("QuestionBankService - update", () => {
  it("is refused while any quiz using it is live", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("a", "draft"), quiz("b", "live")]
    });

    await expect(service.update("question-1", mcqDto())).rejects.toThrow(
      '"Quiz b" is live right now'
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("raises 404 for a deleted question", async () => {
    const { service } = buildService({ isActive: false });

    await expect(service.update("question-1", mcqDto())).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("QuestionBankService - remove", () => {
  it("soft-deletes an unused question", async () => {
    const { service, prisma } = buildService();

    await expect(service.remove("question-1")).resolves.toEqual({
      message: "Question deleted from the bank",
      removed_from_quizzes: 0
    });
    const update = prisma.question.update.mock.calls[0][0] as any;
    expect(update).toEqual({
      where: { id: "question-1" },
      data: { is_active: false }
    });
  });

  it("takes the question out of draft quizzes, but keeps ended quizzes intact", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("d", "draft"), quiz("e", "ended")]
    });

    await service.remove("question-1");

    const unlink = prisma.quizQuestion.deleteMany.mock.calls[0][0] as any;
    expect(unlink.where).toEqual({
      question_id: "question-1",
      quiz_id: { in: ["d"] }
    });
  });

  it("refuses with 409 and the quiz list when a published quiz uses it", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("u", "upcoming")]
    });

    const error = await service.remove("question-1").catch((e) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({
      quizzes: [expect.objectContaining({ id: "u" })]
    });
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it("with force, removes it from the published quiz too", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("u", "upcoming"), quiz("d", "draft")]
    });

    await expect(service.remove("question-1", true)).resolves.toMatchObject({
      removed_from_quizzes: 2
    });
    expect(prisma.question.update).toHaveBeenCalled();
  });

  it("refuses even with force while a quiz using it is live", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("l", "live")]
    });

    await expect(service.remove("question-1", true)).rejects.toThrow(
      ConflictException
    );
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it("refuses with force when it would empty a published quiz", async () => {
    const { service, prisma } = buildService({
      quizzes: [quiz("u", "upcoming")],
      questionCounts: { u: 1 }
    });

    await expect(service.remove("question-1", true)).rejects.toThrow(
      /only question in "Quiz u"/
    );
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it("raises 404 for an already-deleted question", async () => {
    const { service } = buildService({ isActive: false });

    await expect(service.remove("question-1")).rejects.toThrow(
      NotFoundException
    );
  });
});
