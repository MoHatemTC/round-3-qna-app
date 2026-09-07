import { Module } from "@nestjs/common";
import { NotificationService } from "./notifications.service.js";
import { MailerAdapter } from "./adapters/mailer.adapter.js";
import { MailModule } from "../mail/mail.module.js";

@Module({
  imports: [MailModule],
  providers: [NotificationService, MailerAdapter],
  exports: [NotificationService]
})
export class NotificationsModule {}
