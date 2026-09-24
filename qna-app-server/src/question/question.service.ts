import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CreateQuestionDto } from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import {
  AttachQuestionsDto,
  ReorderQuestionsDto
} from "./dto/quiz-question-links.dto.js";
import { AttemptStatus, QuizStatus, Role } from "../generated/prisma/enums.js";
import {
  LIVE_LOCK_MESSAGE,
  QuestionBankService,
  bankQuestionInclude,
  isQuizLive,
  optionsCreate,
  questionFields
} from "./question-bank.service.js";

// What a student may see of a question while taking a quiz. is_correct is
// deliberately absent - it is never read from the database for this shape.
export const attemptQuestionSelect = {
  id: true,
  type: true,
  text: true,
  points: true,
  options: {
    select: { id: true, text: true },
    orderBy: { created_at: "asc" }
  }
} as const;

// A quiz's questions are bank questions linked through quiz_questions. These
// routes manage the links; editing a question here edits the bank copy, which
// every quiz using it shares.
@Injectable()
export class QuestionService {
  constructor(
    private prisma: PrismaService,
    private bank: QuestionBankService
  ) {}

  private async assertQuizExists(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException("Quiz not found");
    return quiz;
  }

  // Changing questions while students may be mid-attempt would change what
  // they're being graded on, so questions are locked while a quiz is live.
  private async assertEditable(quizId: string) {
    const quiz = await this.assertQuizExists(quizId);
    if (isQuizLive(quiz)) throw new BadRequestException(LIVE_LOCK_MESSAGE);
    return quiz;
  }

  private async findLink(quizId: string, questionId: string) {
    const link = await this.prisma.quizQuestion.findUnique({
      where: {
        quiz_id_question_id: { quiz_id: quizId, question_id: questionId }
      }
    });
    if (!link) throw new NotFoundException("Question not found");
    return link;
  }

  private async nextPosition(quizId: string) {
    const last = await this.prisma.quizQuestion.aggregate({
      where: { quiz_id: quizId },
      _max: { position: true }
    });
    return (last._max.position ?? -1) + 1;
  }

  async findAll(quizId: string) {
    await this.assertQuizExists(quizId);
    const links = await this.prisma.quizQuestion.findMany({
      where: { quiz_id: quizId },
      include: { question: { include: bankQuestionInclude } },
      orderBy: [{ position: "asc" }, { added_at: "asc" }]
    });
    return links.map((link) => ({
      ...link.question,
      quiz_id: quizId,
      position: link.position
    }));
  }

  // Question text, type and options for a quiz being attempted. Admins may
  // preview any quiz; everyone else needs a running attempt on a published
  // quiz, so questions can't be read ahead of starting the timer.
  async findForAttempt(quizId: string, user: { id: string; role: Role }) {
    const quiz = await this.assertQuizExists(quizId);
    if (user.role !== Role.admin) {
      if (quiz.status !== QuizStatus.published) {
        throw new NotFoundException("Quiz not found");
      }
      const attempt = await this.prisma.attempt.findFirst({
        where: {
          quiz_id: quizId,
          user_id: user.id,
          status: AttemptStatus.in_progress
        },
        select: { id: true }
      });
      if (!attempt) {
        throw new ForbiddenException(
          "Start an attempt on this quiz before loading its questions"
        );
      }
    }
    return this.getAttemptQuestions(quizId);
  }

  async getAttemptQuestions(quizId: string) {
    const links = await this.prisma.quizQuestion.findMany({
      where: { quiz_id: quizId },
      select: { question: { select: attemptQuestionSelect } },
      orderBy: [{ position: "asc" }, { added_at: "asc" }]
    });
    return links.map((link) => link.question);
  }

  // "Create new question" from inside a quiz: the question goes into the bank
  // and onto the end of this quiz in one write.
  async create(quizId: string, dto: CreateQuestionDto, createdBy: string) {
    await this.assertEditable(quizId);
    this.bank.validateOptions(dto);
    const position = await this.nextPosition(quizId);

    const question = await this.prisma.question.create({
      data: {
        ...questionFields(dto),
        created_by: createdBy,
        options: optionsCreate(dto),
        quizzes: { create: { quiz_id: quizId, position } }
      },
      include: bankQuestionInclude
    });
    return { ...question, quiz_id: quizId, position };
  }

  // "Select from question bank": link existing questions onto the end of the
  // quiz. Questions already in the quiz are skipped rather than duplicated.
  async attach(quizId: string, dto: AttachQuestionsDto) {
    await this.assertEditable(quizId);

    const found = await this.prisma.question.findMany({
      where: { id: { in: dto.question_ids }, is_active: true },
      select: { id: true }
    });
    if (found.length !== dto.question_ids.length) {
      const missing = dto.question_ids.length - found.length;
      throw new NotFoundException(
        `${missing} of the selected questions ${missing === 1 ? "is" : "are"} no longer in the question bank. Refresh and try again.`
      );
    }

    const existing = await this.prisma.quizQuestion.findMany({
      where: { quiz_id: quizId, question_id: { in: dto.question_ids } },
      select: { question_id: true }
    });
    const alreadyLinked = new Set(existing.map((link) => link.question_id));
    const toAdd = dto.question_ids.filter((id) => !alreadyLinked.has(id));

    if (toAdd.length) {
      const start = await this.nextPosition(quizId);
      await this.prisma.quizQuestion.createMany({
        data: toAdd.map((questionId, index) => ({
          quiz_id: quizId,
          question_id: questionId,
          position: start + index
        })),
        skipDuplicates: true
      });
    }

    return {
      added: toAdd.length,
      skipped: alreadyLinked.size,
      questions: await this.findAll(quizId)
    };
  }

  async reorder(quizId: string, dto: ReorderQuestionsDto) {
    await this.assertEditable(quizId);
    const links = await this.prisma.quizQuestion.findMany({
      where: { quiz_id: quizId },
      select: { question_id: true }
    });
    const current = new Set(links.map((link) => link.question_id));
    const sameSet =
      dto.question_ids.length === current.size &&
      dto.question_ids.every((id) => current.has(id));
    if (!sameSet) {
      throw new BadRequestException(
        "The new order must list every question in this quiz exactly once. Refresh and try again."
      );
    }

    await this.prisma.$transaction(
      dto.question_ids.map((questionId, position) =>
        this.prisma.quizQuestion.update({
          where: {
            quiz_id_question_id: { quiz_id: quizId, question_id: questionId }
          },
          data: { position }
        })
      )
    );
    return this.findAll(quizId);
  }

  // Edits the bank question, so the change shows up in every quiz using it.
  async update(quizId: string, questionId: string, dto: UpdateQuestionDto) {
    const link = await this.findLink(quizId, questionId);
    await this.assertEditable(quizId);
    const question = await this.bank.update(questionId, dto);
    return { ...question, quiz_id: quizId, position: link.position };
  }

  // Takes the question out of this quiz only. It stays in the bank.
  async remove(quizId: string, questionId: string) {
    await this.findLink(quizId, questionId);
    const quiz = await this.assertEditable(quizId);
    if (quiz.status === QuizStatus.published) {
      const count = await this.prisma.quizQuestion.count({
        where: { quiz_id: quizId }
      });
      if (count <= 1) {
        throw new BadRequestException(
          "A published quiz needs at least one question. Unpublish it before removing its last question."
        );
      }
    }
    await this.prisma.quizQuestion.delete({
      where: {
        quiz_id_question_id: { quiz_id: quizId, question_id: questionId }
      }
    });
    return {
      message:
        "Question removed from this quiz. It is still in the question bank."
    };
  }
}
