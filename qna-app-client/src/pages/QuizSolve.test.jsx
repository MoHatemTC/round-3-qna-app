import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import QuizSolve from "./QuizSolve";

const mockAttempt = {
  id: "attempt-1",
  end_time: new Date(Date.now() + 5000).toISOString(), // expires in 5s
  questions: [
    { id: "q1", type: "mcq", text: "2 + 2?", options: [{ id: "a", text: "4" }, { id: "b", text: "5" }] },
  ],
};

const mockResult = { score: 1, max_score: 1, percentage: 100 };

beforeEach(() => {
  vi.useFakeTimers();
  global.fetch = vi.fn((url, opts) => {
    if (url.includes("/attempts/start")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAttempt) });
    }
    if (url.includes("/submit")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockResult) });
    }
    return Promise.reject(new Error("unexpected fetch: " + url));
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("auto-submits with the selected answer once the timer expires", async () => {
  render(
    <MemoryRouter initialEntries={["/quiz/quiz-1/solve"]}>
      <Routes>
        <Route path="/quiz/:id/solve" element={<QuizSolve />} />
        <Route path="/quiz/:id/result" element={<div>Result screen</div>} />
      </Routes>
    </MemoryRouter>
  );

  // wait for the attempt to load and the question to render
  await waitFor(() => expect(screen.getByText("2 + 2?")).toBeInTheDocument());

  // student selects an answer before time runs out
  screen.getByText("4").click();

  // advance past the 5-second expiry
  await vi.advanceTimersByTimeAsync(6000);

  await waitFor(() => {
    const submitCall = global.fetch.mock.calls.find(([url]) => url.includes("/submit"));
    expect(submitCall).toBeDefined();
    const body = JSON.parse(submitCall[1].body);
    expect(body.answers).toEqual([{ question_id: "q1", selected_option_id: "a" }]);
  });

  // confirms it actually navigated to the result screen after auto-submit
  await waitFor(() => expect(screen.getByText("Result screen")).toBeInTheDocument());
});