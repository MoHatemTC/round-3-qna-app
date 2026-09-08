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

  // min(started_at + quiz duration, quiz.ends_at): an attempt can't outlive the quiz window.
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

    const existing = await this.prisma.attempt.findFirst({
      where: { quiz_id: quiz.id, user_id: userId }
    });
    if (existing) {
      if (existing.status === AttemptStatus.in_progress) {
        return {
          ...existing,
          end_time: this.computeEndTime(
            existing.started_at,
            quiz.duration_minutes,
            quiz.ends_at
          )
        };
      }
      throw new ConflictException("You have already attempted this quiz");
    }

    const attempt = await this.prisma.attempt.create({
      data: { quiz_id: quiz.id, user_id: userId }
    });

    return {
      ...attempt,
      end_time: this.computeEndTime(
        attempt.started_at,
        quiz.duration_minutes,
        quiz.ends_at
      )
    };
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

    for (const answer of dto.answers) {
      if (
        answer.selected_option_id === undefined &&
        answer.boolean_answer === undefined
      ) {
        throw new BadRequestException(
          `Answer for question ${answer.question_id} needs selected_option_id or boolean_answer`
        );
      }
    }

    const now = new Date();
    const endTime = this.computeEndTime(
      attempt.started_at,
      attempt.quiz.duration_minutes,
      attempt.quiz.ends_at
    );
    const status =
      now > endTime ? AttemptStatus.auto_submitted : AttemptStatus.submitted;

    await this.prisma.$transaction([
      ...dto.answers.map((answer) =>
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
            boolean_answer: answer.boolean_answer
          },
          update: {
            selected_option_id: answer.selected_option_id,
            boolean_answer: answer.boolean_answer
          }
        })
      ),
      this.prisma.attempt.update({
        where: { id: attempt.id },
        data: { status, submitted_at: now }
      })
    ]);

    return this.getResult(id, userId);
  }

  async getResult(id: string, userId: string) {
    const attempt = await this.findOwnedAttempt(id, userId);
    const answers = await this.prisma.attemptAnswer.findMany({
      where: { attempt_id: id },
      orderBy: { created_at: "asc" }
    });
    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      user_id: attempt.user_id,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      status: attempt.status,
      score: attempt.score,
      percentage: attempt.percentage,
      answers
    };
  }
}
