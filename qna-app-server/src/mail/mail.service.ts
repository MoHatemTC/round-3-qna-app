import { Injectable, RequestTimeoutException } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async verifyEmail(email: string) {
    try {
      const today = new Date();
      await this.mailerService.sendMail({
        to: email,
        from: `<no-reply@my-nestjs-app.com>`,
        subject: "Verify your account",
        html: `
            <div>
              <h2>Hello, ${email}</h2>
              <p>Verify your account registered in ${today.toDateString()}</p>
            </div>
            `
      });
    } catch (error) {
      console.error(error);
      throw new RequestTimeoutException();
    }
  }
}
