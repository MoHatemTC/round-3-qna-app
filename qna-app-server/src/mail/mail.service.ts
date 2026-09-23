import {
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

export const MAIL_DELIVERY_ERROR =
  "Failed to send email. Please try again later.";

export class SafeMailException extends ServiceUnavailableException {
  readonly rawReason: string;

  constructor(rawReason: string) {
    super(MAIL_DELIVERY_ERROR);
    this.rawReason = rawReason;
  }
}

// Nodemailer/SMTP error codes that really do mean "the connection timed out".
function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function smtpReason(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return asText(error) || "Unknown mail error";
  }
  const { code, responseCode, response, message } = error as Record<
    string,
    unknown
  >;
  // Prefer the server's own rejection text - that is what tells an admin
  // whether the address was wrong or the relay refused the message.
  const detail =
    asText(response) || asText(message) || "Unknown mail error";
  const prefix = [asText(code), asText(responseCode)]
    .filter(Boolean)
    .join(" ");
  return prefix ? `${prefix}: ${detail}` : detail;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

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
      // Keep the real reason: it is written to email_delivery_logs and is the
      // only thing that explains a failed invitation after the fact.
      const reason = smtpReason(error);
      this.logger.error(`Sending "${subject}" to ${to} failed - ${reason}`);
      throw new SafeMailException(reason);
    }
  }
}
