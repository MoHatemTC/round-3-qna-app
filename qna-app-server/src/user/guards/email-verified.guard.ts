import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma.service.js";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const user = await this.prismaService.user.findUnique({
      where: { id: request.user?.id }
    });

    if (!user) {
      throw new UnauthorizedException("Not logged in");
    }

    if (!user.email_verified_at) {
      throw new UnauthorizedException(
        "Please verify your email address to start a quiz."
      );
    }

    return true;
  }
}
