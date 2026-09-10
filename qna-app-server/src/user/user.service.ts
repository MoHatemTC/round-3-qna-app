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
import { randomInt } from "node:crypto";
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

  private async encryptToken(plainToken: string, saltRound: number) {
    return await bcrypt.hash(plainToken, saltRound);
  }

  async register({ name, email, password }: CreateUserDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (user) throw new ConflictException("This email is already registered");

    const token = randomInt(100_000, 1_000_000).toString();

    const hashedPassword = await this.encryptPassword(password, 10);

    const hashedToken = await this.encryptToken(token, 10);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await this.prismaService.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        verification_token: hashedToken,
        verification_expires: expiresAt
      }
    });

    await this.notificationService.send(
      "verify-email",
      email,
      token,
      "",
      "",
      newUser.id
    );

    return {
      message: "User registered successfully, please verify your mail."
    };
  }

  async login({ email, password }: LoginUserDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    const hashedPassword = user ? user.password_hash : DUMMY_HASH;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.email_verified_at === null) {
      throw new UnauthorizedException("Please verify your account");
    }

    const token = await this.jwtService.signAsync({
      id: user.id,
      role: user.role
    });

    return {
      token
    };
  }

  async verifyEmailToken(email: string, token: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (!user || !user.verification_token || !user.verification_expires) {
      throw new BadRequestException("Invalid verification request");
    }

    if (user.email_verified_at) {
      throw new ConflictException("This account already verfied");
    }

    if (new Date() > user.verification_expires) {
      throw new BadRequestException("Verification token has expired");
    }

    const isTokenValid = await bcrypt.compare(token, user.verification_token);

    if (!isTokenValid) {
      throw new BadRequestException("Invalid verification token");
    }

    await this.prismaService.user.update({
      where: { email },
      data: {
        email_verified_at: new Date(),
        verification_token: null,
        verification_expires: null
      }
    });

    return { message: "Email verified successfully!" };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.email_verified_at !== null) {
      throw new BadRequestException("This account is already verified.");
    }

    const token = randomInt(100_000, 1_000_000).toString();
    const hashedToken = await this.encryptToken(token, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prismaService.user.update({
      where: { email },
      data: {
        verification_token: hashedToken,
        verification_expires: expiresAt
      }
    });

    await this.notificationService.send(
      "verify-email",
      email,
      token,
      "",
      "",
      user.id
    );

    return { message: "Verification email resent successfully." };
  }
}
