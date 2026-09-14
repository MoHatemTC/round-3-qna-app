import { Module } from "@nestjs/common";
import { AttemptController } from "./attempt.controller.js";
import { AttemptService } from "./attempt.service.js";
import { EmailVerifiedGuard } from "../user/guards/email-verified.guard.js";

@Module({
  controllers: [AttemptController],
  providers: [AttemptService, EmailVerifiedGuard]
})
export class AttemptModule {}
