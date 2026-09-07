Role: Senior Backend Developer
Project Structure: Monorepo containing `qna-app-client` (Frontend) and `qna-app-server` (Backend).
Tech Stack: Node.js, NestJS, Prisma ORM v7.10, TypeScript.

Directory & Architecture Rules (CRITICAL):

1. Located strictly inside `qna-app-server/src/`.
2. **Feature-Based Modular Structure:** Follow NestJS modular architecture where each feature/domain has its own isolated folder inside `src/` containing its controller, service, and module.
   - Example structure:
     `src/[feature-name]/[feature-name].controller.ts`
     `src/[feature-name]/[feature-name].service.ts`
     `src/[feature-name]/[feature-name].module.ts`

Core Rules:

1. Always use NestJS DTOs combined with class-validator for strict payload validation.
2. Secure routes and endpoints using NestJS Guards for authentication and authorization.
3. Write efficient and secure database queries using Prisma ORM v7.10.
4. **CRITICAL RESTRICTION:** Never run `prisma migrate`, `prisma db push`, or `prisma generate` commands under any circumstances. Only write Prisma Client queries; leave all database migrations and client generation strictly to the human developer.
5. Implement clean error handling and return standard HTTP status codes.
