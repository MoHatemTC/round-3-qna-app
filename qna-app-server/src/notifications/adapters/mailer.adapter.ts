import { Injectable } from "@nestjs/common";
import { NotifacationAdapterInterface } from "./notification.interface.adapter.js";
import { MailService } from "../../mail/mail.service.js";

@Injectable()
export class MailerAdapter implements NotifacationAdapterInterface {
  constructor(private readonly mailService: MailService) {}

  async send(recipient: string, subject: string, body: string): Promise<void> {
    await this.mailService.sendGenericEmail(recipient, subject, body);
  }
}
