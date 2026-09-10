import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service.js";
import { AttemptStatus, QuizStatus } from "../generated/prisma/enums.js";

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuizzes(userId: string) {
    const invitations = await this.prisma.quizInvitation.findMany({
      where: { user_id: userId },
      include: {
        quiz: { select: { id: true, title: true, duration_minutes: true, ends_at: true, status: true } }
      },
      orderBy: { created_at: "desc" }
    });

    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId },
      select: { quiz_id: true, status: true }
    });
    const attemptByQuiz = new Map(attempts.map((attempt) => [attempt.quiz_id, attempt.status]));

    return invitations.map(({ quiz }) => ({
      id: quiz.id,
      title: quiz.title,
      duration: quiz.duration_minutes,
      deadline: quiz.ends_at,
      state: attemptByQuiz.get(quiz.id) === AttemptStatus.submitted || attemptByQuiz.get(quiz.id) === AttemptStatus.auto_submitted
        ? "submitted"
        : attemptByQuiz.get(quiz.id) === AttemptStatus.in_progress ? "in_progress" : "not_started"
    }));
  }

  async resolveInvite(token: string, userId: string) {
    const invitation = await this.prisma.quizInvitation.findUnique({
      where: { token_hash: createHash("sha256").update(token).digest("hex") },
      include: { quiz: true }
    });
    if (!invitation || invitation.user_id !== userId) return { error: "invalid_link" };
    if (invitation.expires_at && invitation.expires_at < new Date()) return { error: "invalid_link" };
    if (invitation.quiz.status !== QuizStatus.published) return { error: "closed" };
    if (new Date() < invitation.quiz.starts_at) return { error: "not_open_yet" };
    if (new Date() > invitation.quiz.ends_at) return { error: "closed" };

    const attempt = await this.prisma.attempt.findFirst({
      where: { quiz_id: invitation.quiz_id, user_id: userId, status: { in: [AttemptStatus.submitted, AttemptStatus.auto_submitted] } }
    });
    if (attempt?.status === AttemptStatus.submitted || attempt?.status === AttemptStatus.auto_submitted) {
      return { error: "already_submitted" };
    }

    await this.prisma.quizInvitation.update({
      where: { id: invitation.id },
      data: { accepted_at: invitation.accepted_at ?? new Date() }
    });
    return { id: invitation.quiz.id, title: invitation.quiz.title };
  }

  async getQuiz(id: string, userId: string) {
    const invitation = await this.prisma.quizInvitation.findUnique({
      where: { quiz_id_user_id: { quiz_id: id, user_id: userId } },
      include: { quiz: { include: { questions: { select: { id: true } } } } }
    });
    if (!invitation) throw new NotFoundException("Quiz not found");
    return {
      id: invitation.quiz.id,
      title: invitation.quiz.title,
      description: invitation.quiz.description,
      duration: invitation.quiz.duration_minutes,
      starts_at: invitation.quiz.starts_at,
      ends_at: invitation.quiz.ends_at,
      question_count: invitation.quiz.questions.length,
      attempts_allowed: 1
    };
  }
}