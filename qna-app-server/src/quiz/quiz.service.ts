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

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await this.findOne(id);
    const publishing = dto.status === QuizStatus.published;
    if (publishing && quiz._count.questions === 0) {
      throw new BadRequestException(NEEDS_QUESTION_MESSAGE);
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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (!user) throw new NotFoundException("Student account not found");
    const existing = await this.prisma.quizInvitation.findUnique({
      where: { quiz_id_email: { quiz_id: id, email: user.email } }
    });
    if (existing)
      throw new ConflictException("This student has already been invited");
    const token = randomBytes(32).toString("hex");
    const invitation = await this.prisma.quizInvitation.create({
      data: {
        quiz_id: id,
        email: user.email,
        user_id: user.id,
        token_hash: createHash("sha256").update(token).digest("hex")
      }
    });
    const link = `${process.env.CLIENT_URL ?? "http://localhost:5173"}/quiz/invite/${token}`;
    await this.notifications.send(
      "quiz-invitation",
      user.email,
      quiz.title,
      link,
      invitation.id
    );
    return { id: invitation.id, message: "Invitation sent" };
  }
}
