import { BadRequestException, Injectable } from "@nestjs/common";
import {
  QuizInvitationTemplate,
  QuizReminderTemplate
} from "./templates/quiz-invitation-template.js";
import { VerifyEmailTemplate } from "./templates/verifiy-email-template.js";
import { MailerAdapter } from "./adapters/mailer.adapter.js";
import { PrismaService } from "../prisma.service.js";
import { EmailType, EmailStatus } from "../../src/generated/prisma/client.js";
import { QuizInvitationPayload } from "./templates/quiz-invitation-template.js";
import { SafeMailException } from "../mail/mail.service.js";

@Injectable()
export class NotificationService {
  constructor(
    private notificationAdapter: MailerAdapter,
    private prismaService: PrismaService
  ) {}

  async send(
    type: "verify-email" | "quiz-invitation" | "quiz-reminder",
    recipient: string,
    payload: string | QuizInvitationPayload,
    link = "",
    relatedId?: string
  ) {
    let subject = "";
    let body = "";
    let emailType: EmailType;

    switch (type) {
      case "verify-email": {
        if (typeof payload !== "string") {
          throw new BadRequestException(
            "Verification email payload must be a string"
          );
        }
        const verifyData = VerifyEmailTemplate(payload);
        subject = verifyData.subject;
        body = verifyData.body;
        emailType = EmailType.verification;
        break;
      }

      case "quiz-invitation": {
        const quizData = QuizInvitationTemplate(payload, link);
        subject = quizData.subject;
        body = quizData.body;
        emailType = EmailType.invitation;
        break;
      }

      case "quiz-reminder": {
        if (typeof payload === "string") {
          throw new BadRequestException(
            "Quiz reminder payload must be structured"
          );
        }
        const reminderData = QuizReminderTemplate(payload, link);
        subject = reminderData.subject;
        body = reminderData.body;
        emailType = EmailType.invitation;
        break;
      }

      default:
        throw new BadRequestException(`Invalid type: ${type}`);
    }

    const log = await this.prismaService.emailDeliveryLog.create({
      data: {
        type: emailType,
        recipient,
        related_id: relatedId,
        status: EmailStatus.pending
      }
    });

    try {
      await this.notificationAdapter.send(recipient, subject, body);

      await this.prismaService.emailDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.sent,
          sent_at: new Date()
        }
      });
    } catch (error) {
      await this.prismaService.emailDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.failed,
          error_message:
            error instanceof SafeMailException
              ? error.rawReason
              : error instanceof Error
                ? error.message
                : "Unknown error occurred"
        }
      });
      throw error;
    }
  }
}
