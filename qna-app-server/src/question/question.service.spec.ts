import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { QuestionService } from "./question.service.js";
import { QuestionBankService } from "./question-bank.service.js";
import { QuestionType, Role } from "../generated/prisma/enums.js";
import type { CreateQuestionDto } from "./dto/create-question.dto.js";

// Quiz-scoped question authoring: a quiz's questions are bank questions linked
// through quiz_questions. These tests cover the links (create-and-link, attach,
// reorder, unlink), option validation, and the live-quiz lock, against a
// hand-rolled Prisma double.

// Prisma client methods all take one options object. The doubles have to
// declare it, or mock.calls[0][0] is typed as an empty tuple.
type DbArgs = any;

const HOUR = 60 * 60 * 1000;

type QuizRow = {
  id: string;
  title?: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
};

type LinkRow = { quiz_id: string; question_id: string; position: number };

type BankQuestionRow = {
  id: string;
  is_active: boolean;
  options: { id: string; text: string; is_correct: boolean }[];
  quizzes: { position: number; quiz: QuizRow }[];
};

function buildPrisma({
  quiz,
  links = [],
  bankQuestion,
  activeIds = []
}: {
  quiz?: QuizRow | null;
  links?: LinkRow[];
  bankQuestion?: BankQuestionRow | null;
  activeIds?: string[];
} = {}) {
  const findLink = (where: any) =>
    links.find(
      (link) =>
        link.quiz_id === where.quiz_id_question_id.quiz_id &&
        link.question_id === where.quiz_id_question_id.question_id
    ) ?? null;

  const prisma: any = {
    quiz: {
      findUnique: jest.fn(async (_args?: DbArgs) => quiz ?? null)
    },
    quizQuestion: {
      findUnique: jest.fn(async ({ where }: any) => findLink(where)),
      findMany: jest.fn(async ({ where }: any) =>
        links
          .filter(
            (link) =>
              link.quiz_id === where.quiz_id &&
              (!where.question_id ||
                where.question_id.in.includes(link.question_id))
          )
          .sort((a, b) => a.position - b.position)
          .map((link) => ({
            ...link,
            question: { id: link.question_id, options: [] }
          }))
      ),
      aggregate: jest.fn(async (_args?: DbArgs) => ({
        _max: {
          position: links.length
            ? Math.max(...links.map((link) => link.position))
            : null
        }
      })),
      count: jest.fn(async (_args?: DbArgs) => links.length),
      createMany: jest.fn(async ({ data }: any) => ({ count: data.length })),
      update: jest.fn(async (args: DbArgs) => args),
      delete: jest.fn(async (_args?: DbArgs) => ({}))
    },
    question: {
      findUnique: jest.fn(async () => bankQuestion ?? null),
      findMany: jest.fn(async ({ where }: any) =>
        where.id.in
          .filter((id: string) => activeIds.includes(id))
          .map((id: string) => ({ id }))
      ),
      create: jest.fn(async ({ data }: any) => ({
        id: "question-new",
        ...data
      })),
      update: jest.fn(async ({ where, data }: any) => ({
        id: where.id,
        ...data
      }))
    },
    questionOption: {
      deleteMany: jest.fn(async (_args?: DbArgs) => ({ count: 2 }))
    },
    attempt: {
      findFirst: jest.fn(async (_args?: DbArgs) => null as unknown)
    },
    $transaction: jest.fn(async (arg: any) =>
      typeof arg === "function" ? arg(prisma) : Promise.all(arg)
    )
  };
  return prisma;
}

function buildService(options?: Parameters<typeof buildPrisma>[0]) {
  const prisma = buildPrisma(options);
  const bank = new QuestionBankService(prisma as never);
  return { service: new QuestionService(prisma as never, bank), prisma };
}

// A quiz that is published but has not opened yet: editable.
const upcomingQuiz = (overrides: Partial<QuizRow> = {}): QuizRow => ({
  id: "quiz-1",
  title: "Geography",
  status: "published",
  starts_at: new Date(Date.now() + HOUR),
  ends_at: new Date(Date.now() + 4 * HOUR),
  ...overrides
});

// Published and inside its window: students may be taking it right now.
const liveQuiz = (overrides: Partial<QuizRow> = {}): QuizRow =>
  upcomingQuiz({
    starts_at: new Date(Date.now() - HOUR),
    ends_at: new Date(Date.now() + HOUR),
    ...overrides
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

const link = (questionId: string, position: number): LinkRow => ({
  quiz_id: "quiz-1",
  question_id: questionId,
  position
});

const bankQuestion = (
  quizzes: QuizRow[] = [upcomingQuiz()]
): BankQuestionRow => ({
  id: "question-1",
  is_active: true,
  options: [
    { id: "option-1", text: "Paris", is_correct: true },
    { id: "option-2", text: "Lyon", is_correct: false }
  ],
  quizzes: quizzes.map((quiz, position) => ({ position, quiz }))
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
  it("saves the question to the bank and links it to the end of the quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("q-a", 0), link("q-b", 1)]
    });

    const created = await service.create(
      "quiz-1",
      mcqDto({ points: 3, tags: [" Europe ", "europe", "Capitals"] }),
      "admin-1"
    );

    const args = prisma.question.create.mock.calls[0][0] as any;
    expect(args.data).not.toHaveProperty("quiz_id");
    expect(args.data.created_by).toBe("admin-1");
    expect(args.data.type).toBe(QuestionType.mcq);
    expect(args.data.points).toBe(3);
    expect(args.data.difficulty).toBe("medium");
    // Tags are trimmed, lowercased and de-duplicated.
    expect(args.data.tags).toEqual(["europe", "capitals"]);
    expect(args.data.options.create).toEqual([
      { text: "Paris", is_correct: true },
      { text: "Lyon", is_correct: false }
    ]);
    expect(args.data.quizzes).toEqual({
      create: { quiz_id: "quiz-1", position: 2 }
    });
    expect(created).toMatchObject({ quiz_id: "quiz-1", position: 2 });
  });

  it("starts at position 0 on an empty quiz", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.create("quiz-1", mcqDto(), "admin-1");

    const args = prisma.question.create.mock.calls[0][0] as any;
    expect(args.data.quizzes.create.position).toBe(0);
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
      }),
      "admin-1"
    );

    expect(prisma.question.create).toHaveBeenCalled();
  });

  it("raises 404 for a quiz that does not exist", async () => {
    const { service, prisma } = buildService({ quiz: null });

    await expect(
      service.create("missing", mcqDto(), "admin-1")
    ).rejects.toThrow(NotFoundException);
    expect(prisma.question.create).not.toHaveBeenCalled();
  });
});

describe("QuestionService - option validation", () => {
  const rejects = async (dto: CreateQuestionDto, message: string) => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await expect(service.create("quiz-1", dto, "admin-1")).rejects.toThrow(
      message
    );
    // Nothing is written when the shape is wrong.
    expect(prisma.question.create).not.toHaveBeenCalled();
  };

  it("rejects an mcq question with a single option", async () => {
    await rejects(
      mcqDto({ options: [{ text: "Paris", is_correct: true }] }),
      "mcq questions need at least two options"
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

  it("raises BadRequest, not a generic error, so the API answers 400", async () => {
    const { service } = buildService({ quiz: upcomingQuiz() });

    await expect(
      service.create("quiz-1", mcqDto({ options: [] }), "admin-1")
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("QuestionService - editing while a quiz is live", () => {
  it("refuses to add a question to a live quiz", async () => {
    const { service, prisma } = buildService({ quiz: liveQuiz() });

    await expect(service.create("quiz-1", mcqDto(), "admin-1")).rejects.toThrow(
      "This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes."
    );
    expect(prisma.question.create).not.toHaveBeenCalled();
  });

  it("refuses to attach bank questions to a live quiz", async () => {
    const { service, prisma } = buildService({
      quiz: liveQuiz(),
      activeIds: ["q-a"]
    });

    await expect(
      service.attach("quiz-1", { question_ids: ["q-a"] })
    ).rejects.toThrow(/live right now/);
    expect(prisma.quizQuestion.createMany).not.toHaveBeenCalled();
  });

  it("refuses to replace a question on a live quiz", async () => {
    const { service, prisma } = buildService({
      quiz: liveQuiz(),
      links: [link("question-1", 0)],
      bankQuestion: bankQuestion([liveQuiz()])
    });

    await expect(
      service.update("quiz-1", "question-1", mcqDto())
    ).rejects.toThrow(/live right now/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses to remove a question from a live quiz", async () => {
    const { service, prisma } = buildService({
      quiz: liveQuiz(),
      links: [link("question-1", 0), link("question-2", 1)]
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      /live right now/
    );
    expect(prisma.quizQuestion.delete).not.toHaveBeenCalled();
  });

  it("allows edits to a draft quiz inside the same window", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.create("quiz-1", mcqDto(), "admin-1");

    expect(prisma.question.create).toHaveBeenCalled();
  });

  it("allows edits to a published quiz that has already closed", async () => {
    const { service, prisma } = buildService({ quiz: closedQuiz() });

    await service.create("quiz-1", mcqDto(), "admin-1");

    expect(prisma.question.create).toHaveBeenCalled();
  });
});

describe("QuestionService - attach from the bank", () => {
  it("links new questions after the existing ones, in the order given", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("q-a", 0)],
      activeIds: ["q-b", "q-c"]
    });

    const result = await service.attach("quiz-1", {
      question_ids: ["q-c", "q-b"]
    });

    const args = prisma.quizQuestion.createMany.mock.calls[0][0] as any;
    expect(args.data).toEqual([
      { quiz_id: "quiz-1", question_id: "q-c", position: 1 },
      { quiz_id: "quiz-1", question_id: "q-b", position: 2 }
    ]);
    expect(result).toMatchObject({ added: 2, skipped: 0 });
  });

  it("skips questions that are already in the quiz", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("q-a", 0)],
      activeIds: ["q-a", "q-b"]
    });

    const result = await service.attach("quiz-1", {
      question_ids: ["q-a", "q-b"]
    });

    const args = prisma.quizQuestion.createMany.mock.calls[0][0] as any;
    expect(args.data).toEqual([
      { quiz_id: "quiz-1", question_id: "q-b", position: 1 }
    ]);
    expect(result).toMatchObject({ added: 1, skipped: 1 });
  });

  it("refuses questions that were deleted from the bank", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      activeIds: ["q-a"]
    });

    await expect(
      service.attach("quiz-1", { question_ids: ["q-a", "q-gone"] })
    ).rejects.toThrow(NotFoundException);
    expect(prisma.quizQuestion.createMany).not.toHaveBeenCalled();
  });
});

describe("QuestionService - reorder", () => {
  it("writes each question's new position", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("q-a", 0), link("q-b", 1), link("q-c", 2)]
    });

    await service.reorder("quiz-1", { question_ids: ["q-c", "q-a", "q-b"] });

    const updates = prisma.quizQuestion.update.mock.calls.map(([args]: any) => [
      args.where.quiz_id_question_id.question_id,
      args.data.position
    ]);
    expect(updates).toEqual([
      ["q-c", 0],
      ["q-a", 1],
      ["q-b", 2]
    ]);
  });

  it("refuses a list that leaves a question out", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("q-a", 0), link("q-b", 1)]
    });

    await expect(
      service.reorder("quiz-1", { question_ids: ["q-b"] })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.quizQuestion.update).not.toHaveBeenCalled();
  });

  it("refuses a list with a question from another quiz", async () => {
    const { service } = buildService({
      quiz: draftQuiz(),
      links: [link("q-a", 0), link("q-b", 1)]
    });

    await expect(
      service.reorder("quiz-1", { question_ids: ["q-a", "q-x"] })
    ).rejects.toThrow(BadRequestException);
  });
});

describe("QuestionService - update", () => {
  it("replaces the bank question's options rather than merging them", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("question-1", 0)],
      bankQuestion: bankQuestion()
    });

    const updated = await service.update(
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

    expect(prisma.questionOption.deleteMany).toHaveBeenCalledWith({
      where: { question_id: "question-1" }
    });
    const args = prisma.question.update.mock.calls[0][0] as any;
    expect(args.where).toEqual({ id: "question-1" });
    expect(args.data.options.create).toHaveLength(3);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(updated).toMatchObject({ quiz_id: "quiz-1", position: 0 });
  });

  it("is refused while another quiz sharing the question is live", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("question-1", 0)],
      bankQuestion: bankQuestion([
        draftQuiz(),
        liveQuiz({ id: "quiz-2", title: "Capitals" })
      ])
    });

    await expect(
      service.update("quiz-1", "question-1", mcqDto())
    ).rejects.toThrow('"Capitals" is live right now');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("raises 404 for a question that is not in this quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [],
      bankQuestion: bankQuestion()
    });

    await expect(
      service.update("quiz-1", "question-1", mcqDto())
    ).rejects.toThrow("Question not found");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("validates the replacement options", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("question-1", 0)],
      bankQuestion: bankQuestion()
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

describe("QuestionService - remove from quiz", () => {
  it("unlinks the question and leaves it in the bank", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("question-1", 0), link("question-2", 1)]
    });

    await expect(service.remove("quiz-1", "question-1")).resolves.toEqual({
      message:
        "Question removed from this quiz. It is still in the question bank."
    });
    expect(prisma.quizQuestion.delete).toHaveBeenCalledWith({
      where: {
        quiz_id_question_id: { quiz_id: "quiz-1", question_id: "question-1" }
      }
    });
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it("refuses to remove the last question of a published quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("question-1", 0)]
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      "A published quiz needs at least one question. Unpublish it before removing its last question."
    );
    expect(prisma.quizQuestion.delete).not.toHaveBeenCalled();
  });

  it("allows removing the last question of a draft quiz", async () => {
    const { service, prisma } = buildService({
      quiz: draftQuiz(),
      links: [link("question-1", 0)]
    });

    await service.remove("quiz-1", "question-1");

    expect(prisma.quizQuestion.delete).toHaveBeenCalled();
  });

  it("raises 404 for a question that is not in this quiz", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("question-2", 0)]
    });

    await expect(service.remove("quiz-1", "question-1")).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.quizQuestion.delete).not.toHaveBeenCalled();
  });
});

describe("QuestionService - findAll", () => {
  it("returns a quiz's questions in position order", async () => {
    const { service, prisma } = buildService({
      quiz: upcomingQuiz(),
      links: [link("q-b", 1), link("q-a", 0)]
    });

    const questions = await service.findAll("quiz-1");

    const args = prisma.quizQuestion.findMany.mock.calls[0][0] as any;
    expect(args.where).toEqual({ quiz_id: "quiz-1" });
    expect(args.orderBy).toEqual([{ position: "asc" }, { added_at: "asc" }]);
    expect(questions.map((q: any) => [q.id, q.position])).toEqual([
      ["q-a", 0],
      ["q-b", 1]
    ]);
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

    const args = prisma.quizQuestion.findMany.mock.calls[0][0] as any;
    expect(args.select.question.select.options.select).toEqual({
      id: true,
      text: true
    });
    expect(JSON.stringify(args.select)).not.toContain("is_correct");
    expect(args.orderBy).toEqual([{ position: "asc" }, { added_at: "asc" }]);
  });

  it("lets an admin preview a draft quiz", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await service.findForAttempt("quiz-1", admin);

    expect(prisma.quizQuestion.findMany).toHaveBeenCalled();
    // An admin preview does not need an attempt.
    expect(prisma.attempt.findFirst).not.toHaveBeenCalled();
  });

  it("hides an unpublished quiz from a student", async () => {
    const { service, prisma } = buildService({ quiz: draftQuiz() });

    await expect(service.findForAttempt("quiz-1", student)).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
  });

  it("requires a student to have an in-progress attempt", async () => {
    const { service, prisma } = buildService({ quiz: upcomingQuiz() });

    await expect(service.findForAttempt("quiz-1", student)).rejects.toThrow(
      ForbiddenException
    );
    expect(prisma.quizQuestion.findMany).not.toHaveBeenCalled();
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
    expect(prisma.quizQuestion.findMany).toHaveBeenCalled();
  });
});
