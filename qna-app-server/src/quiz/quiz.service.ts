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
    const quiz = await this.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (!user) throw new NotFoundException("Student account not found");
    const existing = await this.prisma.quizInvitation.findUnique({
      where: { quiz_id_user_id: { quiz_id: id, user_id: user.id } }
    });
    if (existing)
      throw new ConflictException("This student has already been invited");
    const token = randomBytes(32).toString("hex");
    const invitation = await this.prisma.quizInvitation.create({
      data: {
        quiz_id: id,
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
