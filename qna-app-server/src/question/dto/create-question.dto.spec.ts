import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { CreateQuestionDto } from "./create-question.dto.js";
import { UpdateQuestionDto } from "./update-question.dto.js";

// The field-level half of question validation. The mcq/true_false option rules
// live in question-rules.spec.ts; these are the checks that must reject a
// payload before the service ever sees it.
function validate(payload: unknown, dto = CreateQuestionDto) {
  const instance = plainToInstance(dto, payload, {
    enableImplicitConversion: false
  });
  return validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true
  });
}

function messages(payload: unknown, dto = CreateQuestionDto) {
  return validate(payload, dto)
    .flatMap((error) => [
      ...Object.values(error.constraints ?? {}),
      ...(error.children ?? []).flatMap((child) =>
        Object.values(child.constraints ?? {}).concat(
          (child.children ?? []).flatMap((grandchild) =>
            Object.values(grandchild.constraints ?? {})
          )
        )
      )
    ])
    .join(" | ");
}

const validPayload = {
  type: "mcq",
  text: "What is the capital of France?",
  points: 1,
  options: [
    { text: "Paris", is_correct: true },
    { text: "Lyon", is_correct: false }
  ]
};

describe("CreateQuestionDto", () => {
  it("accepts a well-formed mcq payload", () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it("accepts a well-formed true_false payload", () => {
    expect(
      validate({
        ...validPayload,
        type: "true_false",
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false }
        ]
      })
    ).toHaveLength(0);
  });

  it("rejects an unknown question type", () => {
    expect(messages({ ...validPayload, type: "essay" })).toContain(
      "type must be one of the following values: mcq, true_false"
    );
  });

  it("rejects a missing type", () => {
    const { type, ...withoutType } = validPayload;
    void type;
    expect(messages(withoutType)).toContain("type must be one of");
  });

  it("rejects empty question text", () => {
    expect(messages({ ...validPayload, text: "" })).toContain(
      "text must be longer than or equal to 1 characters"
    );
  });

  it("rejects non-string question text", () => {
    expect(messages({ ...validPayload, text: 42 })).toContain(
      "text must be a string"
    );
  });

  it("rejects zero points", () => {
    expect(messages({ ...validPayload, points: 0 })).toContain(
      "points must be greater than 0"
    );
  });

  it("rejects negative points", () => {
    expect(messages({ ...validPayload, points: -3 })).toContain(
      "points must be greater than 0"
    );
  });

  it("rejects fractional points", () => {
    expect(messages({ ...validPayload, points: 1.5 })).toContain(
      "points must be an integer number"
    );
  });

  it("rejects an empty options array", () => {
    expect(messages({ ...validPayload, options: [] })).toContain(
      "options must contain at least 1 elements"
    );
  });

  it("rejects options that are not an array", () => {
    expect(messages({ ...validPayload, options: "Paris" })).toContain(
      "options must be an array"
    );
  });

  it("rejects an option with blank text", () => {
    expect(
      messages({
        ...validPayload,
        options: [
          { text: "", is_correct: true },
          { text: "Lyon", is_correct: false }
        ]
      })
    ).toContain("text must be longer than or equal to 1 characters");
  });

  it("rejects a non-boolean is_correct", () => {
    expect(
      messages({
        ...validPayload,
        options: [
          { text: "Paris", is_correct: "yes" },
          { text: "Lyon", is_correct: false }
        ]
      })
    ).toContain("is_correct must be a boolean value");
  });

  it("rejects an option missing is_correct", () => {
    expect(
      messages({
        ...validPayload,
        options: [{ text: "Paris" }, { text: "Lyon", is_correct: false }]
      })
    ).toContain("is_correct must be a boolean value");
  });

  it("rejects unknown top-level fields", () => {
    expect(messages({ ...validPayload, quiz_id: "someone-elses-quiz" })).toContain(
      "property quiz_id should not exist"
    );
  });
});

describe("UpdateQuestionDto", () => {
  it("requires the same full payload as create, since PUT replaces the question", () => {
    expect(messages({ text: "Only the text" }, UpdateQuestionDto)).toContain(
      "type must be one of"
    );
  });

  it("accepts a well-formed replacement", () => {
    expect(validate(validPayload, UpdateQuestionDto)).toHaveLength(0);
  });
});
