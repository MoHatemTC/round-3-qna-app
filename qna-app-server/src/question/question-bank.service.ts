import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CreateQuestionDto } from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import { QuestionBankQueryDto } from "./dto/question-bank-query.dto.js";
import {
  QuestionDifficulty,
  QuestionType,
  QuizStatus
} from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
import { questionProblem } from "./question-rules.js";

type QuizWindow = {
  status: QuizStatus;
  starts_at: Date;
  ends_at: Date;
};

// Students may be mid-attempt, so a live quiz's questions can't change.
export function isQuizLive(quiz: QuizWindow, now = new Date()) {
  return (
    quiz.status === QuizStatus.published &&
    quiz.starts_at <= now &&
    now <= quiz.ends_at
  );
}

// Published and not yet over: students have been, or will be, sent this quiz.
export function isQuizActive(quiz: QuizWindow, now = new Date()) {
  return quiz.status === QuizStatus.published && quiz.ends_at > now;
}

export const LIVE_LOCK_MESSAGE =
  "This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes.";

// The admin shape of a bank question: its answer key plus every quiz it is
// used in, so the UI can warn before an edit or delete reaches other quizzes.
export const bankQuestionInclude = {
  options: { orderBy: { created_at: "asc" } },
  quizzes: {
    select: {
      position: true,
      quiz: {
        select: {
          id: true,
          title: true,
          status: true,
          starts_at: true,
          ends_at: true
        }
      }
    },
    orderBy: { added_at: "asc" }
  }
} as const satisfies Prisma.QuestionInclude;

function cleanTags(tags: string[] | undefined) {
  if (!tags) return [];
  return [
    ...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
  ];
}

function cleanCategory(category: string | undefined) {
  const trimmed = category?.trim();
  return trimmed ? trimmed : null;
}

// Column values shared by create and update. Options are handled separately
// because an update replaces them.
export function questionFields(dto: CreateQuestionDto) {
  return {
    type: dto.type,
    text: dto.text,
    points: dto.points,
    explanation: dto.explanation?.trim() || null,
    category: cleanCategory(dto.category),
    difficulty: dto.difficulty ?? QuestionDifficulty.medium,
    tags: cleanTags(dto.tags)
  };
}

export function optionsCreate(dto: CreateQuestionDto) {
  return {
    create: dto.options.map((o) => ({ text: o.text, is_correct: o.is_correct }))
  };
}

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  validateOptions(dto: CreateQuestionDto) {
    const problem = questionProblem(dto.type, dto.options);
    if (problem) throw new BadRequestException(problem);
  }

  private async findActive(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: bankQuestionInclude
    });
    if (!question || !question.is_active) {
      throw new NotFoundException("Question not found");
    }
    return question;
  }

  async list(query: QuestionBankQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const where: Prisma.QuestionWhereInput = { is_active: true };

    if (query.search?.trim()) {
      where.text = { contains: query.search.trim(), mode: "insensitive" };
    }
    if (query.type) where.type = query.type;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.category?.trim()) {
      where.category = { equals: query.category.trim(), mode: "insensitive" };
    }
    const tags = cleanTags(query.tags);
    if (tags.length) where.tags = { hasSome: tags };
    if (query.created_from || query.created_to) {
      where.created_at = {
        ...(query.created_from && { gte: new Date(query.created_from) }),
        // A bare date means "through the end of that day".
        ...(query.created_to && {
          lt: endOfDay(query.created_to)
        })
      };
    }
    if (query.exclude_quiz_id) {
      where.quizzes = { none: { quiz_id: query.exclude_quiz_id } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: bankQuestionInclude,
        orderBy: [{ created_at: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.question.count({ where })
    ]);

    return { items, total, page, page_size: pageSize };
  }

  // Values for the category and tag filter dropdowns.
  async facets() {
    const [categories, tags] = await Promise.all([
      this.prisma.question.findMany({
        where: { is_active: true, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" }
      }),
      this.prisma.$queryRaw<{ tag: string }[]>`
        SELECT DISTINCT unnest("tags") AS tag
        FROM "Question"
        WHERE "is_active" = true
        ORDER BY tag`
    ]);
    return {
      categories: categories.map((row) => row.category as string),
      tags: tags.map((row) => row.tag),
      types: Object.values(QuestionType),
      difficulties: Object.values(QuestionDifficulty)
    };
  }

  findOne(id: string) {
    return this.findActive(id);
  }

  // async so a rejected payload surfaces as a rejected promise.
  async create(dto: CreateQuestionDto, createdBy: string) {
    this.validateOptions(dto);
    return this.prisma.question.create({
      data: {
        ...questionFields(dto),
        created_by: createdBy,
        options: optionsCreate(dto)
      },
      include: bankQuestionInclude
    });
  }

  // An edit changes the question everywhere it is used, so it is refused while
  // any of those quizzes is live.
  async update(id: string, dto: UpdateQuestionDto) {
    const question = await this.findActive(id);
    const live = question.quizzes.find((link) => isQuizLive(link.quiz));
    if (live) {
      throw new BadRequestException(
        `"${live.quiz.title}" is live right now and uses this question, so it is locked. Unpublish that quiz or wait until it closes to make changes.`
      );
    }
    this.validateOptions(dto);

    return this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({ where: { question_id: id } });
      return tx.question.update({
        where: { id },
        data: { ...questionFields(dto), options: optionsCreate(dto) },
        include: bankQuestionInclude
      });
    });
  }

  // Soft delete. A question used by a published quiz that hasn't ended is
  // refused unless force is set; with force it is taken out of those quizzes.
  // Ended quizzes keep their link so past results still add up.
  async remove(id: string, force = false) {
    const question = await this.findActive(id);
    const now = new Date();

    const live = question.quizzes.filter((link) => isQuizLive(link.quiz, now));
    if (live.length) {
      throw new ConflictException({
        statusCode: 409,
        error: "Conflict",
        message: `This question is in a quiz that is live right now (${titles(live)}). It can't be deleted until that quiz closes or is unpublished.`,
        quizzes: live.map((link) => link.quiz)
      });
    }

    const active = question.quizzes.filter((link) =>
      isQuizActive(link.quiz, now)
    );
    if (active.length && !force) {
      throw new ConflictException({
        statusCode: 409,
        error: "Conflict",
        message: `This question is used in ${active.length} published ${active.length === 1 ? "quiz" : "quizzes"} (${titles(active)}). Delete it anyway to remove it from ${active.length === 1 ? "that quiz" : "those quizzes"}.`,
        quizzes: active.map((link) => link.quiz)
      });
    }

    if (active.length) {
      const counts = await this.prisma.quizQuestion.groupBy({
        by: ["quiz_id"],
        where: { quiz_id: { in: active.map((link) => link.quiz.id) } },
        _count: { _all: true }
      });
      const emptied = active.filter(
        (link) =>
          (counts.find((row) => row.quiz_id === link.quiz.id)?._count._all ??
            0) <= 1
      );
      if (emptied.length) {
        throw new BadRequestException(
          `This is the only question in ${titles(emptied)}. A published quiz needs at least one question - add another question or unpublish the quiz first.`
        );
      }
    }

    const unlinkFrom = question.quizzes
      .filter((link) => link.quiz.ends_at > now)
      .map((link) => link.quiz.id);

    await this.prisma.$transaction([
      this.prisma.quizQuestion.deleteMany({
        where: { question_id: id, quiz_id: { in: unlinkFrom } }
      }),
      this.prisma.question.update({
        where: { id },
        data: { is_active: false }
      })
    ]);

    return {
      message: "Question deleted from the bank",
      removed_from_quizzes: unlinkFrom.length
    };
  }
}

function titles(links: { quiz: { title: string } }[]) {
  return links.map((link) => `"${link.quiz.title}"`).join(", ");
}

function endOfDay(value: string) {
  const date = new Date(value);
  // Only widen date-only values; a full timestamp is taken as given.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}
