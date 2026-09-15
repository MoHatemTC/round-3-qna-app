import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma.service.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { UpdateQuizDto } from "./dto/update-quiz.dto.js";
import { CreateInvitationDto } from "./dto/create-invitation.dto.js";
import { NotificationService } from "../notifications/notifications.service.js";
import { QuizStatus } from "../generated/prisma/enums.js";

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService
  ) {}

  create(dto: CreateQuizDto, createdBy: string) {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration_minutes: dto.duration_minutes,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        status: dto.status,
        created_by: createdBy
      }
    });
  }

  findAll() {
    return this.prisma.quiz.findMany({ orderBy: { created_at: "desc" } });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException("Quiz not found");
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    await this.findOne(id);
    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        duration_minutes: dto.duration_minutes,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        status: dto.status
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { message: "Quiz deleted successfully" };
  }

  async invite(id: string, dto: CreateInvitationDto) {
    const quiz = await this.findOne(id);
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
}
