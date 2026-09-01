import { Injectable, RequestTimeoutException } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async sendGenericEmail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({
        to,
        from: `<no-reply@my-nestjs-app.com>`,
        subject,
        html
      });
    } catch (error) {
      console.error(error);
      throw new RequestTimeoutException();
    }
  }
}
