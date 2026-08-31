import {
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

  async register({ name, email, password, role }: CreateUserDTO) {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    });

    if (user) throw new ConflictException("This email is already registered");

    const hashedPassword = await this.encryptPassword(password, 10);

    await this.prismaService.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role
      }
    });

    await this.mailService.verifyEmail(email);

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
}
