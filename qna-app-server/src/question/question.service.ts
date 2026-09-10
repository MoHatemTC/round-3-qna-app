import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import {
  CreateQuestionDto,
  QuestionOptionInputDto
} from "./dto/create-question.dto.js";
import { UpdateQuestionDto } from "./dto/update-question.dto.js";
import { QuestionType } from "../generated/prisma/enums.js";

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  private validateOptions(
    type: QuestionType,
    options: QuestionOptionInputDto[]
  ) {
    const correctCount = options.filter((o) => o.is_correct).length;

    if (type === QuestionType.mcq) {
      if (options.length < 2) {
        throw new BadRequestException(
          "mcq questions need at least two options"
        );
      }
      if (correctCount !== 1) {
        throw new BadRequestException(
          "mcq questions need exactly one correct option"
        );
      }
    } else {
      if (options.length !== 2) {
        throw new BadRequestException(
          "true_false questions need exactly two options"
        );
      }
      if (correctCount !== 1) {
        throw new BadRequestException(
          "true_false questions need exactly one correct value"
        );
      }
    }
  }

  private async assertQuizExists(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException("Quiz not found");
  }

  private async findOwned(quizId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true }
    });
    if (!question || question.quiz_id !== quizId) {
      throw new NotFoundException("Question not found");
    }
    return question;
  }

  async findAll(quizId: string) {
    await this.assertQuizExists(quizId);
    return this.prisma.question.findMany({
      where: { quiz_id: quizId },
      include: { options: true },
      orderBy: { created_at: "asc" }
    });
  }

  async create(quizId: string, dto: CreateQuestionDto) {
    await this.assertQuizExists(quizId);
    this.validateOptions(dto.type, dto.options);

    return this.prisma.question.create({
      data: {
        quiz_id: quizId,
        type: dto.type,
        text: dto.text,
        points: dto.points,
        options: {
          create: dto.options.map((o) => ({
            text: o.text,
            is_correct: o.is_correct
          }))
        }
      },
      include: { options: true }
    });
  }

  async update(quizId: string, questionId: string, dto: UpdateQuestionDto) {
    await this.findOwned(quizId, questionId);
    this.validateOptions(dto.type, dto.options);

    return this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({
        where: { question_id: questionId }
      });
      return tx.question.update({
        where: { id: questionId },
        data: {
          type: dto.type,
          text: dto.text,
          points: dto.points,
          options: {
            create: dto.options.map((o) => ({
              text: o.text,
              is_correct: o.is_correct
            }))
          }
        },
        include: { options: true }
      });
    });
  }

  async remove(quizId: string, questionId: string) {
    await this.findOwned(quizId, questionId);
    await this.prisma.question.delete({ where: { id: questionId } });
    return { message: "Question deleted successfully" };
  }
}
