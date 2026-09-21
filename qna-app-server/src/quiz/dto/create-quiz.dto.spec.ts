import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { CreateQuizDto } from "./create-quiz.dto.js";
import { UpdateQuizDto } from "./update-quiz.dto.js";

// Field-level and cross-field validation for quiz create/replace. The rules
// that need the clock or the database (window vs duration, publish gate) are
// covered in quiz.service.spec.ts.
function validate(payload: unknown, dto = CreateQuizDto) {
  return validateSync(plainToInstance(dto, payload) as object, {
    whitelist: true,
    forbidNonWhitelisted: true
  });
}

function messages(payload: unknown, dto = CreateQuizDto) {
  return validate(payload, dto)
    .flatMap((error) => Object.values(error.constraints ?? {}))
    .join(" | ");
}

const validPayload = {
  title: "JavaScript Fundamentals",
  description: "Covers closures, prototypes, and async/await.",
  duration_minutes: 30,
  starts_at: "2026-09-10T09:00:00.000Z",
  ends_at: "2026-09-10T10:00:00.000Z"
};

describe("CreateQuizDto", () => {
  it("accepts a well-formed payload", () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it("accepts a payload with no description", () => {
    const { description, ...withoutDescription } = validPayload;
    void description;
    expect(validate(withoutDescription)).toHaveLength(0);
  });

  it("rejects an empty title", () => {
    expect(messages({ ...validPayload, title: "" })).toContain(
      "title must be longer than or equal to 1 characters"
    );
  });

  it("rejects a missing title", () => {
    const { title, ...withoutTitle } = validPayload;
    void title;
    expect(messages(withoutTitle)).toContain("title must be a string");
  });

  it("rejects zero duration", () => {
    expect(messages({ ...validPayload, duration_minutes: 0 })).toContain(
      "duration_minutes must be greater than 0"
    );
  });

  it("rejects a negative duration", () => {
    expect(messages({ ...validPayload, duration_minutes: -10 })).toContain(
      "duration_minutes must be greater than 0"
    );
  });

  it("rejects a fractional duration", () => {
    expect(messages({ ...validPayload, duration_minutes: 12.5 })).toContain(
      "duration_minutes must be an integer number"
    );
  });

  it("rejects a non-date starts_at", () => {
    expect(messages({ ...validPayload, starts_at: "next tuesday" })).toContain(
      "starts_at must be a valid ISO 8601 date string"
    );
  });

  it("rejects ends_at before starts_at", () => {
    expect(
      messages({
        ...validPayload,
        starts_at: "2026-09-10T10:00:00.000Z",
        ends_at: "2026-09-10T09:00:00.000Z"
      })
    ).toContain("ends_at must be after starts_at");
  });

  it("rejects ends_at equal to starts_at", () => {
    expect(
      messages({
        ...validPayload,
        starts_at: "2026-09-10T09:00:00.000Z",
        ends_at: "2026-09-10T09:00:00.000Z"
      })
    ).toContain("ends_at must be after starts_at");
  });

  it("rejects an unknown status", () => {
    expect(messages({ ...validPayload, status: "archived" })).toContain(
      "status must be one of the following values: draft, published"
    );
  });

  it("accepts an explicit draft status", () => {
    expect(validate({ ...validPayload, status: "draft" })).toHaveLength(0);
  });

  it("rejects unknown fields so a client cannot set created_by", () => {
    expect(messages({ ...validPayload, created_by: "someone-else" })).toContain(
      "property created_by should not exist"
    );
  });

  it("rejects an attempt to set the quiz id", () => {
    expect(messages({ ...validPayload, id: "chosen-by-client" })).toContain(
      "property id should not exist"
    );
  });
});

describe("UpdateQuizDto", () => {
  it("requires the whole quiz, since PUT replaces it", () => {
    const errors = validate({ title: "Only a new title" }, UpdateQuizDto);
    const properties = errors.map((error) => error.property).sort();
    expect(properties).toEqual(["duration_minutes", "ends_at", "starts_at"]);
  });

  it("accepts a full replacement", () => {
    expect(
      validate({ ...validPayload, status: "published" }, UpdateQuizDto)
    ).toHaveLength(0);
  });
});
