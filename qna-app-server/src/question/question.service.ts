import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import {
  CreateQuestionDto,
  QuestionOptionInputDto
} from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import {
  AttemptStatus,
  QuestionType,
  QuizStatus,
  Role
} from "../generated/prisma/enums.js";
import { questionProblem } from "./question-rules.js";

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

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  private validateOptions(
    type: QuestionType,
    options: QuestionOptionInputDto[]
  ) {
    const problem = questionProblem(type, options);
    if (problem) throw new BadRequestException(problem);
  }

  private async assertQuizExists(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException("Quiz not found");
    return quiz;
  }

  // Changing questions while students may be mid-attempt would change what
  // they're being graded on, so questions are locked while a quiz is live.
  private async assertEditable(quizId: string) {
    const quiz = await this.assertQuizExists(quizId);
    const now = new Date();
    if (
      quiz.status === QuizStatus.published &&
      quiz.starts_at <= now &&
      now <= quiz.ends_at
    ) {
      throw new BadRequestException(
        "This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes."
      );
    }
  }

  private async findOwned(quizId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true }
    });
    if (!question || question.quiz_id !== quizId) {
      throw new NotFoundException("Question not found");
    }
    return question;
  }

  async findAll(quizId: string) {
    await this.assertQuizExists(quizId);
    return this.prisma.question.findMany({
      where: { quiz_id: quizId },
      include: { options: true },
      orderBy: { created_at: "asc" }
    });
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

  getAttemptQuestions(quizId: string) {
    return this.prisma.question.findMany({
      where: { quiz_id: quizId },
      select: attemptQuestionSelect,
      orderBy: { created_at: "asc" }
    });
  }

  async create(quizId: string, dto: CreateQuestionDto) {
    await this.assertEditable(quizId);
    this.validateOptions(dto.type, dto.options);

    return this.prisma.question.create({
      data: {
        quiz_id: quizId,
        type: dto.type,
        text: dto.text,
        points: dto.points,
        options: {
          create: dto.options.map((o) => ({
            text: o.text,
            is_correct: o.is_correct
          }))
        }
      },
      include: { options: true }
    });
  }

  async update(quizId: string, questionId: string, dto: UpdateQuestionDto) {
    await this.findOwned(quizId, questionId);
    await this.assertEditable(quizId);
    this.validateOptions(dto.type, dto.options);

    return this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({
        where: { question_id: questionId }
      });
      return tx.question.update({
        where: { id: questionId },
        data: {
          type: dto.type,
          text: dto.text,
          points: dto.points,
          options: {
            create: dto.options.map((o) => ({
              text: o.text,
              is_correct: o.is_correct
            }))
          }
        },
        include: { options: true }
      });
    });
  }

  async remove(quizId: string, questionId: string) {
    await this.findOwned(quizId, questionId);
    await this.assertEditable(quizId);
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { _count: { select: { questions: true } } }
    });
    if (quiz?.status === QuizStatus.published && quiz._count.questions <= 1) {
      throw new BadRequestException(
        "A published quiz needs at least one question. Unpublish it before removing its last question."
      );
    }
    await this.prisma.question.delete({ where: { id: questionId } });
    return { message: "Question deleted successfully" };
  }
}
