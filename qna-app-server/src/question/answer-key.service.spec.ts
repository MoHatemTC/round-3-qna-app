import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { AnswerKeyService } from "./answer-key.service.js";
import { findKeyPath } from "../testing/payload-scan.js";

// The answer key is internal: attempt scoring is allowed to read is_correct,
// but no controller may hand it to a client. These tests pin both halves.

const SRC_DIR = resolve(__dirname, "..");

function sourceFiles(dir: string, suffix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // The generated Prisma client is not ours and holds no routes.
      return entry.name === "generated" ? [] : sourceFiles(full, suffix);
    }
    return entry.name.endsWith(suffix) ? [full] : [];
  });
}

describe("the answer key stays internal", () => {
  it("is referenced by no controller", () => {
    const offenders = sourceFiles(SRC_DIR, ".controller.ts")
      .filter((file) =>
        /AnswerKeyService|answer-key/.test(readFileSync(file, "utf8"))
      )
      .map((file) => relative(SRC_DIR, file));

    expect(offenders).toEqual([]);
  });

  it("is never returned straight out of a route handler", () => {
    const offenders = sourceFiles(SRC_DIR, ".controller.ts")
      .filter((file) => /getAnswerKey/.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC_DIR, file));

    expect(offenders).toEqual([]);
  });

  it("is reachable only from attempt scoring", () => {
    const users = sourceFiles(SRC_DIR, ".ts")
      .filter((file) => !file.endsWith(".spec.ts"))
      .filter((file) => /AnswerKeyService/.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC_DIR, file).replace(/\\/g, "/"))
      .sort();

    // The provider itself, the module that wires it, and the scoring service.
    // A new name showing up here means something else gained access to the
    // answer key and needs a second look.
    expect(users).toEqual([
      "attempt/attempt.service.ts",
      "question/answer-key.service.ts",
      "question/question.module.ts"
    ]);
  });

  it("does read is_correct, because scoring needs it", async () => {
    const prisma = {
      question: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "question-1",
            type: "mcq",
            points: 2,
            options: [{ id: "opt-1", text: "Paris", is_correct: true }]
          }
        ])
      }
    };

    const key = await new AnswerKeyService(prisma as any).getAnswerKey(
      "quiz-1"
    );

    const [args] = prisma.question.findMany.mock.calls[0];
    expect(findKeyPath(args.select, "is_correct")).not.toBeNull();
    expect(key.get("question-1")?.options[0].is_correct).toBe(true);
  });
});
