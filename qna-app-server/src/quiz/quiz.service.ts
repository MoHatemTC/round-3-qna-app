import {
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
    // get quiz data by quiz id
    const quiz = await this.findOne(id);
    // store users email in an array
    const usersEmail: string[] = dto.emails ?? [],
      // store users email in an array
      usersId: string[] = dto.usersId ?? [];
    // check if there users in db
    if (usersId.length) {
      // get all users
      const users = await this.prisma.user.findMany({
        where: { id: { in: usersId } },
        select: { id: true, email: true }
      });
      // loop over users data and check if user account exist or not
      for (const user of users) {
        if (user?.email) {
          usersEmail.push(user.email);
        }
      }
    }
    // clear duplicates
    const uniqueUsersEmail = [
      ...new Set(
        usersEmail.map((userEmail) => userEmail.trim().toLocaleLowerCase())
      )
    ];
    // counter for quiz invitation status
    let sentCount = 0,
      failedCount = 0,
      skippedCount = 0;
    // user email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // iterate over unique users email
    for (const email of uniqueUsersEmail) {
      // if a mail failed at validation test, failedCount will increase by +1
      if (!emailRegex.test(email)) {
        failedCount++;
        continue;
      }
      // if email passed validation test go to try-catch
      try {
        // get user by mail
        const user = await this.prisma.user.findUnique({
          where: { email }
        });
        // check if user has invitation token or otp
        const existing = await this.prisma.quizInvitation.findUnique({
          where: { quiz_id_email: { quiz_id: id, email } }
        });
        // if user has the token just skip
        if (existing) {
          skippedCount++;
          continue;
        }
        // else create the inviatation token
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const invitation = await this.prisma.quizInvitation.create({
          data: {
            quiz_id: id,
            email: email,
            user_id: user?.id ?? null,
            token_hash: tokenHash,
            status: "sent",
            sent_at: new Date()
          }
        });
        const link = `${process.env.CLIENT_URL ?? "http://localhost:5173"}/quiz/invite/${token}`;
        await this.notifications.send(
          "quiz-invitation",
          email,
          quiz.title,
          link,
          invitation.id
        );
        sentCount++;
      } catch (error) {
        failedCount++;
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
      throw new NotFoundException("Quiz invitation not found!")
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
