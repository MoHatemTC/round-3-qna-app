import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import * as bcrypt from "bcryptjs";
import { CreateUserDTO } from "./dto/create-user-dto.js";
import { LoginUserDTO } from "./dto/login-user-dto.js";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomInt } from "node:crypto";
import { NotificationService } from "../notifications/notifications.service.js";

const DUMMY_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService
  ) {}

  private async encryptPassword(plainText: string, saltRound: number) {
    return await bcrypt.hash(plainText, saltRound);
  }

  private encryptToken(plainToken: string, saltRound: number) {
    return createHash("sha256").update(plainToken).digest("hex");
  }

  private linkPendingInvitations(email: string, userId: string) {
    return this.prismaService.quizInvitation.updateMany({
      where: { email, user_id: null },
      data: { user_id: userId }
    });
  }

  async register({ name, email: emailTrim, password }: CreateUserDTO) {
    const email = emailTrim.trim().toLowerCase();
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (user) throw new ConflictException("This email is already registered");

    const token = randomInt(100_000, 1_000_000).toString();

    const hashedPassword = await this.encryptPassword(password, 10);

    const hashedToken = this.encryptToken(token, 10);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await this.prismaService.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        verification_token: hashedToken,
        verification_expires: expiresAt,
        verification_sent_at: new Date()
      }
    });

    await this.notificationService.send(
      "verify-email",
      email,
      token,
      "",
      newUser.id
    );

    return {
      message: "User registered successfully, please verify your mail."
    };
  }

  async login({ email: trimEmail, password }: LoginUserDTO) {
    const email = trimEmail.trim().toLowerCase();
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    const hashedPassword = user ? user.password_hash : DUMMY_HASH;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.email_verified_at === null) {
      const token = randomInt(100_000, 1_000_000).toString();
      const hashedToken = await this.encryptToken(token, 10);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          verification_token: hashedToken,
          verification_expires: expiresAt,
          verification_sent_at: new Date()
        }
      });

      await this.notificationService.send(
        "verify-email",
        email,
        token,
        "",
        user.id
      );

      throw new UnauthorizedException({
        message: "Please verify your account",
        code: "UNVERIFIED_ACCOUNT",
        email: email
      });
    }

    await this.linkPendingInvitations(user.email, user.id);

    const token = await this.jwtService.signAsync({
      id: user.id,
      role: user.role
    });

    return {
      token
    };
  }

  async verifyEmailToken(token: string) {
    if (!token) throw new BadRequestException("Verification token is required");
    const tokenHash = this.encryptToken(token, 0);
    const user = await this.prismaService.user.findFirst({
      where: { verification_token: tokenHash }
    });

    if (!user) throw new BadRequestException("Invalid verification token");
    await this.linkPendingInvitations(user.email, user.id);
    if (user.email_verified_at)
      return {
        status: "already_verified",
        message: "Email is already verified."
      };
    if (!user.verification_expires)
      throw new BadRequestException("Invalid verification request");

    if (new Date() > user.verification_expires) {
      throw new BadRequestException("Verification token has expired");
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        email_verified_at: new Date(),
        verification_token: null,
        verification_expires: null
      }
    });

    await this.linkPendingInvitations(user.email, user.id);

    return { status: "verified", message: "Email verified successfully!" };
  }

  // Session payload for the client: the JWT's id/role plus display details.
  async getSessionUser(tokenUser: { id: string; role: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: tokenUser.id },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!user) throw new UnauthorizedException("Please login or register");
    return user;
  }
  //////
  async resendVerificationEmail(trimEmail: string) {
    const email = trimEmail.trim().toLowerCase();
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.email_verified_at !== null) {
      throw new BadRequestException("This account is already verified.");
    }

    if (
      user.verification_sent_at &&
      Date.now() - user.verification_sent_at.getTime() < 60_000
    ) {
      throw new BadRequestException(
        "Please wait one minute before requesting another email."
      );
    }
    const token = randomInt(100_000, 1_000_000).toString();
    const hashedToken = this.encryptToken(token, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prismaService.user.update({
      where: { email },
      data: {
        verification_token: hashedToken,
        verification_expires: expiresAt,
        verification_sent_at: new Date()
      }
    });

    await this.notificationService.send(
      "verify-email",
      email,
      token,
      "",
      user.id
    );

    return { message: "Verification email resent successfully." };
  }
}
