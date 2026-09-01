import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

@Injectable()
export class RequireAuth implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.token;

    if (typeof token === "object" && token !== null) {
      token = (token as any).token || (token as any).value;
    }

    if (!token || typeof token !== "string") {
      return res.status(401).json({ error: "Please login or register" });
    }

    try {
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret as string);

      (req as any).user = decoded;

      next();
    } catch (error) {
      console.error("JWT Verify Error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }
}

export function RequireRole(adminRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;

    if (!role || role !== adminRole) {
      throw new ForbiddenException("FORBIDDEN");
    }

    next();
  };
}
