import type { Role } from "../generated/prisma/enums.js";

// Populated by RequireAuth (middlewares/auth.middleware.ts) from the "token" cookie's JWT payload.
declare module "express" {
  interface Request {
    user?: { id: string; role: Role };
  }
}
