import { describe, it, expect } from "vitest";
import { getRemainingMs, hasExpired } from "./quizTimer";

describe("quiz timer", () => {
  it("computes positive remaining time before end_time", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(getRemainingMs(future)).toBeGreaterThan(0);
    expect(hasExpired(future)).toBe(false);
  });

  it("reports expired once end_time has passed", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(getRemainingMs(past)).toBeLessThan(0);
    expect(hasExpired(past)).toBe(true);
  });

  it("treats exactly-zero remaining time as expired", () => {
    const now = new Date().toISOString();
    expect(hasExpired(now, new Date(now).getTime())).toBe(true);
  });
});