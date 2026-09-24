import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma.service.js";
import { AttemptStatus, InvitationStatus, QuizStatus } from "../generated/prisma/enums.js";
import { finalizeExpiredAttempts, quizAvailability } from "../attempt/attempt-timing.js";

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  private async attemptStateByQuiz(userId: string, quizId?: string) {
    await finalizeExpiredAttempts(this.prisma, { user_id: userId, quiz_id: quizId });
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId, quiz_id: quizId },
      select: { quiz_id: true, status: true }
    });

    // A finished attempt wins over a running one, which wins over none.
    const states = new Map<string, "submitted" | "in_progress">();
    for (const attempt of attempts) {
      if (attempt.status === AttemptStatus.in_progress) {
        if (!states.has(attempt.quiz_id)) states.set(attempt.quiz_id, "in_progress");
      } else {
        states.set(attempt.quiz_id, "submitted");
      }
    }
    return states;
  }

  async getQuizzes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Quiz not found");

    const invitations = await this.prisma.quizInvitation.findMany({
      where: {
        status: { in: ["sent", "accepted"] },
        OR: [{ user_id: userId }, { email: user.email }]
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            duration_minutes: true,
            ends_at: true,
            starts_at: true,
            status: true
          }
        }
      },
      orderBy: { quiz: { starts_at: "asc" } }
    });
    ///
    const now = new Date();
    ///
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId },
      select: { quiz_id: true, status: true }
    });
    const attemptByQuiz = new Map(
      attempts.map((attempt) => [attempt.quiz_id, attempt.status])
    );

    return invitations.map(({ quiz }) => ({
      id: quiz.id,
      title: quiz.title,
      duration: quiz.duration_minutes,
      starts_at: quiz.starts_at,
      deadline: quiz.ends_at,
      /////
      availability: quizAvailability(quiz, now),
      ////
      state:
        attemptByQuiz.get(quiz.id) === AttemptStatus.submitted ||
        attemptByQuiz.get(quiz.id) === AttemptStatus.auto_submitted
          ? "submitted"
          : attemptByQuiz.get(quiz.id) === AttemptStatus.in_progress
            ? "in_progress"
            : "not_started"
    }));
  }

  // In-app notifications are derived from invitations: one per invite to a
  // published quiz. "Read" = the student has opened it (accepted_at is set),
  // the same flag the emailed invite link sets - so no extra table is needed.
  async getNotifications(userId: string) {
    const where = { user_id: userId, quiz: { status: QuizStatus.published } };
    const [invitations, unreadCount] = await Promise.all([
      this.prisma.quizInvitation.findMany({
        where,
        include: {
          quiz: { select: { id: true, title: true, starts_at: true, ends_at: true } }
        },
        orderBy: { created_at: "desc" },
        take: 20
      }),
      this.prisma.quizInvitation.count({ where: { ...where, accepted_at: null } })
    ]);

    const now = new Date();
    return {
      unread_count: unreadCount,
      notifications: invitations.map((invitation) => ({
        id: invitation.id,
        type: "quiz_invitation",
        quiz_id: invitation.quiz.id,
        quiz_title: invitation.quiz.title,
        starts_at: invitation.quiz.starts_at,
        ends_at: invitation.quiz.ends_at,
        availability: quizAvailability(invitation.quiz, now),
        created_at: invitation.sent_at ?? invitation.created_at,
        read: invitation.accepted_at !== null
      }))
    };
  }

  async markNotificationRead(id: string, userId: string) {
    const invitation = await this.prisma.quizInvitation.findFirst({
      where: { id, user_id: userId }
    });
    if (!invitation) throw new NotFoundException("Notification not found");
    if (!invitation.accepted_at) {
      await this.prisma.quizInvitation.update({
        where: { id },
        data: { accepted_at: new Date(), status: InvitationStatus.accepted }
      });
    }
    return { message: "Notification marked as read" };
  }

  async markAllNotificationsRead(userId: string) {
    const { count } = await this.prisma.quizInvitation.updateMany({
      where: { user_id: userId, accepted_at: null, quiz: { status: QuizStatus.published } },
      data: { accepted_at: new Date(), status: InvitationStatus.accepted }
    });
    return { updated: count };
  }

  async resolveInvite(token: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "invalid_link" };

    const invitation = await this.prisma.quizInvitation.findFirst({
      where: {
        token_hash: createHash("sha256").update(token).digest("hex"),
        status: { in: ["sent", "accepted"] },
        OR: [{ user_id: userId }, { email: user.email }]
      },
      include: { quiz: true }
    });
    if (!invitation)
      return { error: "invalid_link" };
    if (invitation.expires_at && invitation.expires_at < new Date())
      return { error: "expired_link" };
    if (invitation.quiz.status !== QuizStatus.published)
      return { error: "closed" };
    if (new Date() < invitation.quiz.starts_at)
      return { error: "not_open_yet" };
    if (new Date() > invitation.quiz.ends_at) return { error: "closed" };

    const attempt = await this.prisma.attempt.findFirst({
      where: {
        quiz_id: invitation.quiz_id,
        user_id: userId,
        status: { in: [AttemptStatus.submitted, AttemptStatus.auto_submitted] }
      }
    });
    if (
      attempt?.status === AttemptStatus.submitted ||
      attempt?.status === AttemptStatus.auto_submitted
    ) {
      return { error: "already_submitted" };
    }

    await this.prisma.quizInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        accepted_at: invitation.accepted_at ?? new Date()
      }
    });
    return { id: invitation.quiz.id, title: invitation.quiz.title };
  }

  async getQuiz(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Quiz not found");
    const invitation = await this.prisma.quizInvitation.findFirst({
      where: {
        quiz_id: id,
        status: { in: ["sent", "accepted"] },
        OR: [{ user_id: userId }, { email: user.email }]
      },
      include: {
        quiz: { include: { _count: { select: { questions: true } } } }
      }
    });
    if (!invitation || invitation.quiz.status !== QuizStatus.published) {
      throw new NotFoundException("Quiz not found");
    }
    const states = await this.attemptStateByQuiz(userId, id);
    return {
      availability: quizAvailability(invitation.quiz),
      state: states.get(id) ?? "not_started",
      server_time: new Date(),
      id: invitation.quiz.id,
      title: invitation.quiz.title,
      description: invitation.quiz.description,
      duration: invitation.quiz.duration_minutes,
      starts_at: invitation.quiz.starts_at,
      ends_at: invitation.quiz.ends_at,
      question_count: invitation.quiz._count.questions,
      attempts_allowed: 1
    };
  }
}
