// Test-only stand-in for src/generated/prisma/client.ts, wired up by the
// moduleNameMapper in package.json's jest config.
//
// The generated client is ESM-only (it reads import.meta.url), so jest's
// CommonJS runtime cannot require it. These unit tests never reach a database
// anyway - they hand the services a fake Prisma object - so re-exporting the
// generated enums and a hollow PrismaClient is everything they need.
export * from "../generated/prisma/enums.js";

// Constructor arguments are ignored: PrismaService passes an adapter that no
// test ever uses.
export class PrismaClient {}
