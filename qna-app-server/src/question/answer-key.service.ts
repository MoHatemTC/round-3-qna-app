import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { QuestionType } from "../generated/prisma/enums.js";

export type AnswerKeyEntry = {
  id: string;
  type: QuestionType;
  points: number;
  options: { id: string; text: string; is_correct: boolean }[];
};

// INTERNAL ONLY. The answer key (every option's is_correct flag) for a quiz,
// consumed by attempt scoring. No controller injects this provider and it must
// never back a public route - the student-facing question read lives in
// QuestionService.findForAttempt and never selects is_correct.
@Injectable()
export class AnswerKeyService {
  constructor(private prisma: PrismaService) {}

  async getAnswerKey(quizId: string): Promise<Map<string, AnswerKeyEntry>> {
    const links = await this.prisma.quizQuestion.findMany({
      where: { quiz_id: quizId },
      select: {
        question: {
          select: {
            id: true,
            type: true,
            points: true,
            options: { select: { id: true, text: true, is_correct: true } }
          }
        }
      }
    });
    return new Map(links.map(({ question }) => [question.id, question]));
  }
}
