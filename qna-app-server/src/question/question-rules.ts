import { QuestionType } from "../generated/prisma/enums.js";

// The single definition of a well-formed question, shared by the authoring
// endpoints (which reject bad input) and the publish gate (which refuses to
// publish a quiz whose stored questions don't meet it).
export function questionProblem(
  type: QuestionType,
  options: { is_correct: boolean }[]
): string | null {
  const correctCount = options.filter((o) => o.is_correct).length;

  if (type === QuestionType.mcq) {
    if (options.length < 2) return "mcq questions need at least two options";
    if (correctCount !== 1)
      return "mcq questions need exactly one correct option";
  } else {
    if (options.length !== 2)
      return "true_false questions need exactly two options";
    if (correctCount !== 1)
      return "true_false questions need exactly one correct value";
  }
  return null;
}
