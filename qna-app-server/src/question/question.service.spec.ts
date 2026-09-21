import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { QuestionService } from "./question.service.js";
import { QuestionType, Role } from "../generated/prisma/enums.js";
import type { CreateQuestionDto } from "./dto/create-question.dto.js";

// Question authoring has two jobs: reject malformed questions, and refuse any
// change while students could be mid-attempt. Both are exercised here against a
// hand-rolled Prisma double.

// Prisma client methods all take one options object. The doubles have to
// declare it, or mock.calls[0][0] is typed as an empty tuple.
type DbArgs = any;

const HOUR = 60 * 60 * 1000;

type QuizRow = {
  id: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
  _count?: { questions: number };
};

type QuestionRow = {
  id: string;
  quiz_id: string;
  options: { id: string; text: string; is_correct: boolean }[];
};

function buildPrisma({
  quiz,
  question,
  questionCount = 3
}: {
  quiz?: QuizRow | null;
  question?: QuestionRow | null;
  questionCount?: number;
} = {}) {
  const prisma = {
    quiz: {
      findUnique: jest.fn(async (args: any) =>
        quiz
          ? args?.include?._count
            ? { ...quiz, _count: { questions: questionCount } }
            : quiz
          : null
      )
    },
    question: {
      findUnique: jest.fn(async () => question ?? null),
      findMany: jest.fn(async (_args?: DbArgs) => [] as unknown[]),
      create: jest.fn(async ({ data }: any) => ({ id: "question-new", ...data })),
      update: jest.fn(async ({ where, data }: any) => ({
        id: where.id,
        ...data
      })),
      delete: jest.fn(async (_args?: DbArgs) => question)
    },
    questionOption: {
      deleteMany: jest.fn(async (_args?: DbArgs) => ({ count: 2 }))
    },
    attempt: {
      findFirst: jest.fn(async (_args?: DbArgs) => null as unknown)
    },
    $transaction: jest.fn(async (callback: any) => callback(prisma))
  };
  return prisma;
}

function buildService(options?: Parameters<typeof buildPrisma>[0]) {
  const prisma = buildPrisma(options);
  return { service: new QuestionService(prisma as never), prisma };
}

// A quiz that is published but has not opened yet: editable.
const upcomingQuiz = (overrides: Partial<QuizRow> = {}): QuizRow => ({
  id: "quiz-1",
  status: "published",
  starts_at: new Date(Date.now() + HOUR),
  ends_at: new Date(Date.now() + 4 * HOUR),
  ...overrides
});

// Published and inside its window: students may be taking it right now.
const liveQuiz = (): QuizRow =>
  upcomingQuiz({
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR)
  });

const draftQuiz = (): QuizRow =>
  upcomingQuiz({
    status: "draft",
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR)
  });

const closedQuiz = (): QuizRow =>
  upcomingQuiz({
    starts_at: new Date(Date.now() - 4 * HOUR),
    ends_at: new Date(Date.now() - HOUR)
  });

const ownedQuestion = (): QuestionRow => ({
  id: "question-1",
  quiz_id: "quiz-1",
  options: [
    { id: "option-1", text: "Paris", is_correct: true },
    { id: "option-2", text: "Lyon", is_correct: false }
  ]
});

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

describe("QuestionService - create", () => {
  it("stores the question with its options", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await service.create("quiz-1", mcqDto({ points: 3 }));

    const args = prisma.question.create.mock.calls[0][0] as any;
    expect(args.data.quiz_id).toBe("quiz-1");
    expect(args.data.type).toBe(QuestionType.mcq);
    expect(args.data.points).toBe(3);
    expect(args.data.options.create).toEqual([
      { text: "Paris", is_correct: true },
      { text: "Lyon", is_correct: false }
    ]);
    expect(args.include).toEqual({ options: true });
  });

  it("stores a true_false question", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await service.create(
      "quiz-1",
      mcqDto({
        type: QuestionType.true_false,
        text: "strict mode enables strictNullChecks.",
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false }
        ]
      })
    );

    expect(prisma.question.create).toHaveBeenCalled();
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service, prisma } = buildService({ quiz: null });

    await expect(service.create("missing", mcqDto())).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.question.create).not.toHaveBeenCalled();
  });
});

describe("QuestionService - option validation", () => {
  const rejects = async (dto: CreateQuestionDto, message: string) => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await expect(service.create("quiz-1", dto)).rejects.toThrow(message);
    // Nothing is written when the shape is wrong.
    expect(prisma.question.create).not.toHaveBeenCalled();
  };

  it("rejects an mcq question with a single option", async () => {
    await rejects(
      mcqDto({ options: [{ text: "Paris", is_correct: true }] }),
      "mcq questions need at least two options"
    );
  });

  it("rejects an mcq question with no correct option", async () => {
    await rejects(
      mcqDto({
        options: [
          { text: "Paris", is_correct: false },
          { text: "Lyon", is_correct: false }
        ]
      }),
      "mcq questions need exactly one correct option"
    );
  });

  it("rejects an mcq question with two correct options", async () => {
    await rejects(
      mcqDto({
        options: [
          { text: "Paris", is_correct: true },
          { text: "Lyon", is_correct: true }
        ]
      }),
      "mcq questions need exactly one correct option"
    );
  });

  it("rejects a true_false question with three options", async () => {
    await rejects(
      mcqDto({
        type: QuestionType.true_false,
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false },
          { text: "Maybe", is_correct: false }
        ]
      }),
      "true_false questions need exactly two options"
    );
  });

  it("rejects a true_false question with one option", async () => {
    await rejects(
      mcqDto({
        type: QuestionType.true_false,
        options: [{ text: "True", is_correct: true }]
      }),
      "true_false questions need exactly two options"
    );
  });

  it("rejects a true_false question with both values correct", async () => {
    await rejects(
      mcqDto({
        type: QuestionType.true_false,
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: true }
        ]
      }),
      "true_false questions need exactly one correct value"
    );
  });

  it("rejects a true_false question with neither value correct", async () => {
    await rejects(
      mcqDto({
        type: QuestionType.true_false,
        options: [
          { text: "True", is_correct: false },
          { text: "False", is_correct: false }
        ]
      }),
      "true_false questions need exactly one correct value"
    );
  });

  it("raises BadRequest, not a generic error, so the API answers 400", async () => {
    const { service } = buildService({ quiz: upcomingQuiz() });

    await expect(
      service.create("quiz-1", mcqDto({ options: [] }))
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("QuestionService - editing while a quiz is live", () => {
  it("refuses to add a question to a live quiz", async () => {
    const { service, prisma } = buildService({ quiz: liveQuiz() });

    await expect(service.create("quiz-1", mcqDto())).rejects.toThrow(
      "This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes."
    );
    expect(prisma.question.create).not.toHaveBeenCalled();
  });

  it("refuses to replace a question on a live quiz", async () => {
    const { service, prisma } = buildService({
      quiz: liveQuiz(),
      question: ownedQuestion()
    });

    await expect(
      service.update("quiz-1", "question-1", mcqDto())
    ).rejects.toThrow(/live right now/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses to delete a question from a live quiz", async () => {
    const { service, prisma } = buildService({
      quiz: liveQuiz(),
      question: ownedQuestion()
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      /live right now/
    );
    expect(prisma.question.delete).not.toHaveBeenCalled();
  });

  it("allows edits to a draft quiz inside the same window", async () => {
    // Same clock as liveQuiz, but a draft cannot be attempted, so it is open
    // for editing.
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.create("quiz-1", mcqDto());

    expect(prisma.question.create).toHaveBeenCalled();
  });

  it("allows edits to a published quiz that has not opened yet", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await service.create("quiz-1", mcqDto());

    expect(prisma.question.create).toHaveBeenCalled();
  });

  it("allows edits to a published quiz that has already closed", async () => {
    const { service, prisma } = buildService({ quiz: closedQuiz() });

    await service.create("quiz-1", mcqDto());

    expect(prisma.question.create).toHaveBeenCalled();
  });
});

describe("QuestionService - update", () => {
  it("replaces the options rather than merging them", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: ownedQuestion()
    });

    await service.update(
      "quiz-1",
      "question-1",
      mcqDto({
        text: "Which city is the capital of France?",
        options: [
          { text: "Paris", is_correct: true },
          { text: "Marseille", is_correct: false },
          { text: "Nice", is_correct: false }
        ]
      })
    );

    // Old options are removed inside the transaction before the new set is
    // created, so a shrinking question cannot leave orphans behind.
    expect(prisma.questionOption.deleteMany).toHaveBeenCalledWith({
      where: { question_id: "question-1" }
    });
    const args = prisma.question.update.mock.calls[0][0] as any;
    expect(args.data.options.create).toHaveLength(3);
  });

  it("does both writes in one transaction", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: ownedQuestion()
    });

    await service.update("quiz-1", "question-1", mcqDto());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("raises 404 for a question that does not exist", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: null
    });

    await expect(
      service.update("quiz-1", "missing", mcqDto())
    ).rejects.toThrow("Question not found");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("raises 404 for a question that belongs to a different quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: { ...ownedQuestion(), quiz_id: "another-quiz" }
    });

    await expect(
      service.update("quiz-1", "question-1", mcqDto())
    ).rejects.toThrow("Question not found");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("validates the replacement options", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: ownedQuestion()
    });

    await expect(
      service.update(
        "quiz-1",
        "question-1",
        mcqDto({ options: [{ text: "Paris", is_correct: true }] })
      )
    ).rejects.toThrow("mcq questions need at least two options");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("QuestionService - remove", () => {
  it("deletes a question the quiz owns", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: ownedQuestion(),
      questionCount: 3
    });

    await expect(service.remove("quiz-1", "question-1")).resolves.toEqual({
      message: "Question deleted successfully"
    });
    expect(prisma.question.delete).toHaveBeenCalledWith({
      where: { id: "question-1" }
    });
  });

  it("refuses to remove the last question of a published quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: ownedQuestion(),
      questionCount: 1
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      "A published quiz needs at least one question. Unpublish it before removing its last question."
    );
    expect(prisma.question.delete).not.toHaveBeenCalled();
  });

  it("allows removing the last question of a draft quiz", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      question: ownedQuestion(),
      questionCount: 1
    });

    await service.remove("quiz-1", "question-1");

    expect(prisma.question.delete).toHaveBeenCalled();
  });

  it("raises 404 for a question that belongs to a different quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      question: { ...ownedQuestion(), quiz_id: "another-quiz" }
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.question.delete).not.toHaveBeenCalled();
  });
});

describe("QuestionService - findAll", () => {
  it("returns a quiz's questions with their options in creation order", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await service.findAll("quiz-1");

    const args = prisma.question.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({ quiz_id: "quiz-1" });
    expect(args.include).toEqual({ options: true });
    expect(args.orderBy).toEqual({ created_at: "asc" });
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.findAll("missing")).rejects.toThrow(NotFoundException);
  });
});

describe("QuestionService - findForAttempt", () => {
  const admin = { id: "admin-1", role: Role.admin };
  const student = { id: "user-1", role: Role.student };

  it("never selects is_correct, so the answer key cannot leak", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await service.findForAttempt("quiz-1", admin);

    const args = prisma.question.findMany.mock.calls[0][0] as any;
    expect(args.select.options.select).toEqual({ id: true, text: true });
    expect(args.select).not.toHaveProperty("options.select.is_correct");
    expect(JSON.stringify(args.select)).not.toContain("is_correct");
  });

  it("lets an admin preview a draft quiz", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.findForAttempt("quiz-1", admin);

    expect(prisma.question.findMany).toHaveBeenCalled();
    // An admin preview does not need an attempt.
    expect(prisma.attempt.findFirst).not.toHaveBeenCalled();
  });

  it("hides an unpublished quiz from a student", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await expect(service.findForAttempt("quiz-1", student)).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });

  it("requires a student to have an in-progress attempt", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await expect(service.findForAttempt("quiz-1", student)).rejects.toThrow(
      ForbiddenException
    );
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });

  it("serves the questions to a student who is mid-attempt", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });
    prisma.attempt.findFirst.mockResolvedValue({ id: "attempt-1" } as never);

    await service.findForAttempt("quiz-1", student);

    const lookup = prisma.attempt.findFirst.mock.calls[0][0] as any;
    expect(lookup.where).toEqual({
      quiz_id: "quiz-1",
      user_id: "user-1",
      status: "in_progress"
    });
    expect(prisma.question.findMany).toHaveBeenCalled();
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service } = buildService({ quiz: null });

    await expect(service.findForAttempt("missing", admin)).rejects.toThrow(
      NotFoundException
    );
  });
});
