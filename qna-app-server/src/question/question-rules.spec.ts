import { describe, expect, it } from "@jest/globals";
import { questionProblem } from "./question-rules.js";
import { QuestionType } from "../generated/prisma/enums.js";

// question-rules is the single definition of a well-formed question: the
// authoring endpoints reject input that breaks it, and the publish gate
// refuses to publish a quiz whose stored questions break it. Both behaviours
// hang off this table, so it is tested directly.
const correct = { is_correct: true };
const wrong = { is_correct: false };

describe("questionProblem", () => {
  describe("mcq", () => {
    it("accepts two options with exactly one correct", () => {
      expect(questionProblem(QuestionType.mcq, [correct, wrong])).toBeNull();
    });

    it("accepts many options with exactly one correct", () => {
      expect(
        questionProblem(QuestionType.mcq, [wrong, wrong, correct, wrong])
      ).toBeNull();
    });

    it("rejects no options", () => {
      expect(questionProblem(QuestionType.mcq, [])).toBe(
        "mcq questions need at least two options"
      );
    });

    it("rejects a single option", () => {
      expect(questionProblem(QuestionType.mcq, [correct])).toBe(
        "mcq questions need at least two options"
      );
    });

    it("rejects no correct option", () => {
      expect(questionProblem(QuestionType.mcq, [wrong, wrong])).toBe(
        "mcq questions need exactly one correct option"
      );
    });

    it("rejects more than one correct option", () => {
      expect(questionProblem(QuestionType.mcq, [correct, correct])).toBe(
        "mcq questions need exactly one correct option"
      );
    });

    it("reports the option count before the correct count", () => {
      // A one-option question breaks both rules; the count is the more useful
      // message, so it must win.
      expect(questionProblem(QuestionType.mcq, [wrong])).toBe(
        "mcq questions need at least two options"
      );
    });
  });

  describe("true_false", () => {
    it("accepts exactly two options with one correct", () => {
      expect(
        questionProblem(QuestionType.true_false, [correct, wrong])
      ).toBeNull();
    });

    it("rejects one option", () => {
      expect(questionProblem(QuestionType.true_false, [correct])).toBe(
        "true_false questions need exactly two options"
      );
    });

    it("rejects three options", () => {
      expect(
        questionProblem(QuestionType.true_false, [correct, wrong, wrong])
      ).toBe("true_false questions need exactly two options");
    });

    it("rejects both options being correct", () => {
      expect(
        questionProblem(QuestionType.true_false, [correct, correct])
      ).toBe("true_false questions need exactly one correct value");
    });

    it("rejects neither option being correct", () => {
      expect(questionProblem(QuestionType.true_false, [wrong, wrong])).toBe(
        "true_false questions need exactly one correct value"
      );
    });
  });
});
