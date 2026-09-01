import { Module } from "@nestjs/common";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { PrismaService } from "./../prisma.service.js";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module.js";

@Module({
  imports: [
    MailModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: `1d` }
    })
  ],
  controllers: [UserController],
  providers: [PrismaService, UserService]
})
export class UserModule {}
