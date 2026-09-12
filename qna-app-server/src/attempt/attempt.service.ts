import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { StartAttemptDto } from "./dto/start-attempt.dto.js";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto.js";
import { AttemptStatus, QuizStatus } from "../generated/prisma/enums.js";

@Injectable()
export class AttemptService {
  constructor(private prisma: PrismaService) {}

  private getStudentQuestions(quizId: string) {
    return this.prisma.question.findMany({
      where: { quiz_id: quizId },
      select: {
        id: true,
        type: true,
        text: true,
        points: true,
        options: { select: { id: true, text: true } }
      },
      orderBy: { created_at: "asc" }
    });
  }

  private computeEndTime(
    startedAt: Date,
    durationMinutes: number,
    quizEndsAt: Date
  ) {
    const byDuration = new Date(startedAt.getTime() + durationMinutes * 60_000);
    return byDuration < quizEndsAt ? byDuration : quizEndsAt;
  }

  async start(dto: StartAttemptDto, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quiz_id }
    });
    if (!quiz) throw new NotFoundException("Quiz not found");
    if (quiz.status !== QuizStatus.published) {
      throw new BadRequestException("Quiz is not published");
    }

    const now = new Date();
    if (now < quiz.starts_at)
      throw new BadRequestException("Quiz has not started yet");
    if (now > quiz.ends_at)
      throw new BadRequestException("Quiz has already ended");

    const invitation = await this.prisma.quizInvitation.findUnique({
      where: { quiz_id_user_id: { quiz_id: quiz.id, user_id: userId } }
    });
    if (!invitation)
      throw new ForbiddenException("You are not invited to this quiz");

    const existingSubmittedAttempt = await this.prisma.attempt.findFirst({
      where: {
        quiz_id: quiz.id,
        user_id: userId,
        status: {
          in: [AttemptStatus.submitted, AttemptStatus.auto_submitted]
        }
      }
    });

    if (existingSubmittedAttempt) {
      throw new ConflictException(
        "You have already submitted this quiz. Only one attempt is allowed."
      );
    }

    try {
      const attempt = await this.prisma.attempt.create({
        data: { quiz_id: quiz.id, user_id: userId }
      });
      const questions = await this.getStudentQuestions(quiz.id);

      return {
        ...attempt,
        end_time: this.computeEndTime(
          attempt.started_at,
          quiz.duration_minutes,
          quiz.ends_at
        ),
        questions
      };
    } catch (error: any) {
      if (error.code === "P2002") {
        const existing = await this.prisma.attempt.findFirst({
          where: {
            quiz_id: quiz.id,
            user_id: userId,
            status: AttemptStatus.in_progress
          },
          orderBy: { started_at: "desc" }
        });

        if (existing && existing.status === AttemptStatus.in_progress) {
          const questions = await this.getStudentQuestions(quiz.id);
          return {
            ...existing,
            end_time: this.computeEndTime(
              existing.started_at,
              quiz.duration_minutes,
              quiz.ends_at
            ),
            questions
          };
        }
        throw new ConflictException("You have already attempted this quiz");
      }
      throw error;
    }
  }

  private async findOwnedAttempt(id: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: { quiz: true }
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.user_id !== userId) {
      throw new ForbiddenException("This attempt does not belong to you");
    }
    return attempt;
  }

  async submit(id: string, dto: SubmitAttemptDto, userId: string) {
    const attempt = await this.findOwnedAttempt(id, userId);
    if (attempt.status !== AttemptStatus.in_progress) {
      throw new ConflictException("Attempt already submitted");
    }

    const now = new Date();
    const endTime = this.computeEndTime(
      attempt.started_at,
      attempt.quiz.duration_minutes,
      attempt.quiz.ends_at
    );

    if (now > endTime) {
      throw new BadRequestException("This attempt's time has expired");
    }

    const questions = await this.prisma.question.findMany({
      where: { quiz_id: attempt.quiz_id },
      include: { options: true }
    });
    const questionMap = new Map(
      questions.map((question) => [question.id, question])
    );
    const scoredAnswers = dto.answers.map((answer) => {
      const question = questionMap.get(answer.question_id);
      if (!question) {
        throw new BadRequestException(
          `Question ${answer.question_id} does not belong to this quiz`
        );
      }
      if (
        answer.selected_option_id === undefined &&
        answer.boolean_answer === undefined
      ) {
        throw new BadRequestException(
          `Answer for question ${answer.question_id} needs selected_option_id or boolean_answer`
        );
      }
      if (
        question.type === "mcq" &&
        (!answer.selected_option_id ||
          !question.options.some(
            (option) => option.id === answer.selected_option_id
          ))
      ) {
        throw new BadRequestException(
          `Invalid option for question ${answer.question_id}`
        );
      }
      if (
        question.type === "true_false" &&
        answer.boolean_answer === undefined
      ) {
        throw new BadRequestException(
          `Boolean answer required for question ${answer.question_id}`
        );
      }
      const isCorrect =
        question.type === "mcq"
          ? question.options.some(
              (option) =>
                option.id === answer.selected_option_id && option.is_correct
            )
          : question.options.some(
              (option) =>
                option.is_correct &&
                option.text.toLowerCase() === String(answer.boolean_answer)
            );
      return { answer, isCorrect, points: question.points };
    });
    const score = scoredAnswers.reduce(
      (total, item) => total + (item.isCorrect ? item.points : 0),
      0
    );
    const maxScore = questions.reduce(
      (total, question) => total + question.points,
      0
    );

    await this.prisma.$transaction([
      ...scoredAnswers.map(({ answer, isCorrect }) =>
        this.prisma.attemptAnswer.upsert({
          where: {
            attempt_id_question_id: {
              attempt_id: attempt.id,
              question_id: answer.question_id
            }
          },
          create: {
            attempt_id: attempt.id,
            question_id: answer.question_id,
            selected_option_id: answer.selected_option_id,
            boolean_answer: answer.boolean_answer,
            is_correct: isCorrect
          },
          update: {
            selected_option_id: answer.selected_option_id,
            boolean_answer: answer.boolean_answer,
            is_correct: isCorrect
          }
        })
      ),
      this.prisma.attempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.submitted,
          submitted_at: now,
          score,
          percentage: maxScore === 0 ? 0 : (score / maxScore) * 100
        }
      })
    ]);

    return this.getResult(id, userId);
  }

  async getResult(id: string, userId: string) {
    const attempt = await this.findOwnedAttempt(id, userId);
    const answers = await this.prisma.attemptAnswer.findMany({
      where: { attempt_id: id },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            options: { select: { id: true, text: true, is_correct: true } }
          }
        }
      },
      orderBy: { created_at: "asc" }
    });
    const questions = await this.prisma.question.findMany({
      where: { quiz_id: attempt.quiz_id },
      select: { points: true }
    });

    const isAwaitingGrading =
      (attempt.status === AttemptStatus.submitted ||
        attempt.status === AttemptStatus.auto_submitted) &&
      attempt.score === null;

    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      user_id: attempt.user_id,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      status: attempt.status,
      grading_status: isAwaitingGrading ? "awaiting_grading" : "graded",
      score: attempt.score,
      percentage: attempt.percentage,
      total: answers.filter((answer) => answer.is_correct).length,
      max_score: questions.reduce(
        (total, question) => total + question.points,
        0
      ),
      answers
    };
  }

  getAdminAttempts() {
    return this.prisma.attempt.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        quiz_id: true,
        user_id: true,
        started_at: true,
        submitted_at: true,
        status: true,
        score: true,
        percentage: true,
        user: { select: { name: true, email: true } },
        quiz: { select: { title: true } }
      }
    });
  }
}
