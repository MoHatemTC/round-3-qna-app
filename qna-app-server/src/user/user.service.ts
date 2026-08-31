import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import * as bcrypt from "bcryptjs";
import { CreateUserDTO } from "./create-user-dto.js";
import { LoginUserDTO } from "./login-user-dto.js";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service.js";

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  private async encryptPassword(plainText: string, saltRound: number) {
    return await bcrypt.hash(plainText, saltRound);
  }

  private async encryptToken(plainToken: string, saltRound: number) {
    return await bcrypt.hash(plainToken, saltRound);
  }

  async register({ name, email, password, role }: CreateUserDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (user) throw new ConflictException("This email is already registered");

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await this.encryptPassword(password, 10);

    const hashedToken = await this.encryptToken(token, 10);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prismaService.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role,
        verification_token: hashedToken,
        verification_expires: expiresAt
      }
    });

    await this.mailService.verifyEmail(email, token);

    return {
      message: "User registered successfully, please verify your mail."
    };
  }

  async login({ email, password }: LoginUserDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
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
}
