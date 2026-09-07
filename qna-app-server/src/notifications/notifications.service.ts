import { BadRequestException, Injectable } from "@nestjs/common";
import { QuizInvitationTemplate } from "./templates/quiz-invitation-template.js";
import { VerifyEmailTemplate } from "./templates/verifiy-email-template.js";
import { MailerAdapter } from "./adapters/mailer.adapter.js";

@Injectable()
export class NotificationService {
  constructor(private notificationAdapter: MailerAdapter) {}

  async send(
    type: "verify-email" | "quiz-invitation",
    recipient: string,
    token: string,
    quizTitle: string,
    link: string
  ) {
    let subject = "";
    let body = "";

    switch (type) {
      case "verify-email": {
        const verifyData = VerifyEmailTemplate(token);
        subject = verifyData.subject;
        body = verifyData.body;
        break;
      }

      case "quiz-invitation": {
        const quizData = QuizInvitationTemplate(quizTitle, link);
        subject = quizData.subject;
        body = quizData.body;
        break;
      }

      default:
        throw new BadRequestException(`Invalid type: ${type}`);
    }

    await this.notificationAdapter.send(recipient, subject, body);
  }
}
