import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CreateQuizDto } from "./dto/create-quiz.dto.js";
import { UpdateQuizDto } from "./dto/update-quiz.dto.js";

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

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
}
