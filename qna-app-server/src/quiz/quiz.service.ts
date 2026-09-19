import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { UpdateQuizDto } from "./dto/update-quiz.dto.js";
import { CreateInvitationDto } from "./dto/create-invitation.dto.js";
import { NotificationService } from "../notifications/notifications.service.js";
import { AttemptStatus, QuizStatus } from "../generated/prisma/enums.js";
import { questionProblem } from "../question/question-rules.js";

// Counts the admin CMS needs to show a quiz's activation status.
const quizCounts = {
  _count: { select: { questions: true, invitations: true, attempts: true } }
} as const;

const NEEDS_QUESTION_MESSAGE =
  "Add at least one question before publishing this quiz.";

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService
  ) {}

  // Time rules shared by create and update. ends_at > starts_at is already
  // checked by the DTO's @IsAfter validator.
  private validateSchedule(dto: CreateQuizDto, publishing: boolean) {
    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    const windowMinutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;

    if (dto.duration_minutes > windowMinutes) {
      throw new BadRequestException(
        `Duration (${dto.duration_minutes} min) is longer than the quiz window (${Math.floor(windowMinutes)} min). Shorten the duration or widen the window.`
      );
    }
    if (publishing && endsAt <= new Date()) {
      throw new BadRequestException(
        "This quiz's end time has already passed. Set a later end time before publishing."
      );
    }
  }

  create(dto: CreateQuizDto, createdBy: string) {
    // A brand-new quiz has no questions yet, so it can only start as a draft.
    if (dto.status === QuizStatus.published) {
      throw new BadRequestException(NEEDS_QUESTION_MESSAGE);
    }
    if (new Date(dto.ends_at) <= new Date()) {
      throw new BadRequestException("The end time must be in the future.");
    }
    this.validateSchedule(dto, false);
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration_minutes: dto.duration_minutes,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        status: QuizStatus.draft,
        created_by: createdBy
      },
      include: quizCounts
    });
  }

  findAll() {
    return this.prisma.quiz.findMany({
      orderBy: { created_at: "desc" },
      include: quizCounts
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: quizCounts
    });
    if (!quiz) throw new NotFoundException("Quiz not found");
    return quiz;
  }

  // Refuses publishing unless the quiz has at least one question and every
  // question is well-formed (right option count, exactly one correct answer).
  private async assertPublishable(quizId: string) {
    const questions = await this.prisma.question.findMany({
      where: { quiz_id: quizId },
      select: {
        text: true,
        type: true,
        options: { select: { is_correct: true } }
      },
      orderBy: { created_at: "asc" }
    });
    if (questions.length === 0) {
      throw new BadRequestException(NEEDS_QUESTION_MESSAGE);
    }
    const invalid = questions
      .map((question, index) => ({
        index,
        problem: questionProblem(question.type, question.options)
      }))
      .filter((item) => item.problem);
    if (invalid.length) {
      throw new BadRequestException(
        `Fix these questions before publishing: ${invalid
          .map((item) => `question ${item.index + 1} (${item.problem})`)
          .join("; ")}`
      );
    }
  }

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await this.findOne(id);
    const publishing = dto.status === QuizStatus.published;
    if (publishing && quiz.status !== QuizStatus.published) {
      await this.assertPublishable(id);
    }
    this.validateSchedule(dto, publishing);
    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        duration_minutes: dto.duration_minutes,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        status: dto.status
      },
      include: quizCounts
    });
  }

  async publish(id: string) {
    const quiz = await this.findOne(id);
    if (quiz.status === QuizStatus.published) return quiz;
    await this.assertPublishable(id);
    if (quiz.ends_at <= new Date()) {
      throw new BadRequestException(
        "This quiz's end time has already passed. Set a later end time before publishing."
      );
    }
    return this.prisma.quiz.update({
      where: { id },
      data: { status: QuizStatus.published },
      include: quizCounts
    });
  }

  async unpublish(id: string) {
    const quiz = await this.findOne(id);
    if (quiz.status === QuizStatus.draft) return quiz;
    return this.prisma.quiz.update({
      where: { id },
      data: { status: QuizStatus.draft },
      include: quizCounts
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { message: "Quiz deleted successfully" };
  }

  async invite(id: string, dto: CreateInvitationDto) {
    const quiz = await this.findOne(id);
    if (quiz.ends_at <= new Date()) {
      throw new BadRequestException(
        "This quiz has already ended, so students can no longer take it. Extend its end time to invite more students."
      );
    }
    if (quiz.status !== QuizStatus.published) {
      throw new BadRequestException(
        "Only published quizzes can receive invitations"
      );
    }
    const usersEmail: string[] = dto.emails ?? [],
      userIds: string[] = dto.userIds ?? [];
    if (userIds.length) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });
      for (const user of users) {
        if (user?.email) {
          usersEmail.push(user.email);
        }
      }
    }
    const uniqueUsersEmail = [
      ...new Set(
        usersEmail.map((userEmail) => userEmail.trim().toLocaleLowerCase())
      )
    ];
    let sentCount = 0,
      failedCount = 0,
      skippedCount = 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of uniqueUsersEmail) {
      if (!emailRegex.test(email)) {
        failedCount++;
        continue;
      }
      let invitationId: string | undefined;
      try {
        const user = await this.prisma.user.findUnique({
          where: { email }
        });
        const existing = await this.prisma.quizInvitation.findUnique({
          where: { quiz_id_email: { quiz_id: id, email } }
        });
        if (existing && existing.status !== "failed") {
          skippedCount++;
          continue;
        }
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const invitation = existing
          ? await this.prisma.quizInvitation.update({
              where: { id: existing.id },
              data: {
                user_id: user?.id ?? null,
                token_hash: tokenHash,
                status: "sent",
                sent_at: new Date(),
                accepted_at: null,
                expires_at: quiz.ends_at
              }
            })
          : await this.prisma.quizInvitation.create({
              data: {
                quiz_id: id,
                email,
                user_id: user?.id ?? null,
                token_hash: tokenHash,
                status: "sent",
                sent_at: new Date(),
                expires_at: quiz.ends_at
              }
            });
        invitationId = invitation.id;
        const link = `${process.env.CLIENT_URL ?? "http://localhost:5173"}/quiz/invite/${token}`;
        await this.notifications.send(
          "quiz-invitation",
          email,
          {
            title: quiz.title,
            durationMinutes: quiz.duration_minutes,
            deadline: quiz.ends_at
          },
          link,
          invitationId
        );
        sentCount++;
      } catch (error) {
        failedCount++;
        if (invitationId) {
          await this.prisma.quizInvitation.update({
            where: { id: invitationId },
            data: { status: "failed" }
          });
        }
      }
    }

    return {
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount
    };
  }

  async getQuizInvitations(quizId: string) {
    const quizInvitation = await this.findOne(quizId);
    if (!quizInvitation) {
      throw new NotFoundException("Quiz invitation not found!");
    }
    return this.prisma.quizInvitation.findMany({
      where: { quiz_id: quizId },
      select: {
        id: true,
        email: true,
        status: true,
        sent_at: true,
        accepted_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });
  }

  async getQuizAnalytics(quizId: string) {
    await this.findOne(quizId);

    const [invitedCount, startedCount, submittedCount, submittedAverage] =
      await Promise.all([
        this.prisma.quizInvitation.count({ where: { quiz_id: quizId } }),
        this.prisma.attempt.count({ where: { quiz_id: quizId } }),
        this.prisma.attempt.count({
          where: {
            quiz_id: quizId,
            status: {
              in: [AttemptStatus.submitted, AttemptStatus.auto_submitted]
            }
          }
        }),
        this.prisma.attempt.aggregate({
          where: {
            quiz_id: quizId,
            status: {
              in: [AttemptStatus.submitted, AttemptStatus.auto_submitted]
            }
          },
          _avg: { percentage: true }
        })
      ]);

    return {
      quiz_id: quizId,
      invited_count: invitedCount,
      started_count: startedCount,
      submitted_count: submittedCount,
      completion_rate:
        invitedCount === 0 ? 0 : (submittedCount / invitedCount) * 100,
      average_score:
        submittedCount === 0 ? null : submittedAverage._avg.percentage
    };
  }

  async getQuizStudents(quizId: string, status?: AttemptStatus) {
    await this.findOne(quizId);

    const [invitations, attempts] = await Promise.all([
      this.prisma.quizInvitation.findMany({
        where: { quiz_id: quizId },
        select: {
          email: true,
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { created_at: "desc" }
      }),
      this.prisma.attempt.findMany({
        where: {
          quiz_id: quizId,
          ...(status ? { status } : {})
        },
        select: {
          user_id: true,
          status: true,
          score: true,
          percentage: true,
          created_at: true,
          user: { select: { name: true, email: true } }
        },
        orderBy: { created_at: "desc" }
      })
    ]);

    const attemptsByUserId = new Map(
      attempts.map((attempt) => [attempt.user_id, attempt])
    );
    const attemptsByEmail = new Map(
      attempts.map((attempt) => [attempt.user.email, attempt])
    );

    return invitations
      .map((invitation) => {
        const attempt =
          (invitation.user && attemptsByUserId.get(invitation.user.id)) ??
          attemptsByEmail.get(invitation.user?.email ?? invitation.email);
        const attemptStatus = attempt?.status ?? "not_started";

        return {
          name: invitation.user?.name ?? null,
          email: invitation.user?.email ?? invitation.email,
          score: attempt?.score ?? null,
          percentage: attempt?.percentage ?? null,
          status: attemptStatus
        };
      })
      .filter((student) => !status || student.status === status);
  }
}
