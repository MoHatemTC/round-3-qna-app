import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import QuizSolve from "./QuizSolve";

vi.mock("@/services/services", () => ({
  submitAttempt: vi.fn().mockResolvedValue({ score: 1, max_score: 1 }),
  getAttemptResult: vi.fn(),
}));

import { submitAttempt } from "@/services/services";

const endTime = new Date(Date.now() + 5000).toISOString();

const locationState = {
  attemptId: "attempt-1",
  endTime,
  questions: [
    { id: "q1", type: "mcq", text: "2 + 2?", options: [{ id: "a", text: "4" }, { id: "b", text: "5" }] },
  ],
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  submitAttempt.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderWithState(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/quiz/quiz-1/solve", state }]}>
      <Routes>
        <Route path="/quiz/:id/solve" element={<QuizSolve />} />
        <Route path="/quiz/:id/result" element={<div>Result screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

it("renders the question so we can confirm the component mounts at all", async () => {
  renderWithState(locationState);
  await waitFor(() => expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument(), { timeout: 2000 });
});

it("auto-submits with the selected answer once the timer expires", async () => {
  renderWithState(locationState);
  await waitFor(() => expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument());

  screen.getByText("4").click();
  await vi.advanceTimersByTimeAsync(6000);

  await waitFor(() => {
    expect(submitAttempt).toHaveBeenCalledWith("attempt-1", [{ question_id: "q1", selected_option_id: "a" }]);
  });

  await waitFor(() => expect(screen.getByText("Result screen")).toBeInTheDocument());
});

it("auto-submits with an empty payload if no answers were selected", async () => {
  renderWithState(locationState);
  await waitFor(() => expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument());

  await vi.advanceTimersByTimeAsync(6000);

  await waitFor(() => {
    expect(submitAttempt).toHaveBeenCalledWith("attempt-1", []);
  });
});

it("warns with unanswered question numbers before manual submission", async () => {
  const state = {
    ...locationState,
    questions: [
      locationState.questions[0],
      { id: "q2", type: "mcq", text: "3 + 3?", options: [{ id: "c", text: "6" }] },
    ],
  };
  renderWithState(state);
  await waitFor(() => expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument());

  fireEvent.click(screen.getByText("Submit quiz"));

  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(screen.getByTestId("unanswered-question-numbers")).toHaveTextContent("1, 2");
  expect(submitAttempt).not.toHaveBeenCalled();
});

it("submits immediately when all questions are answered", async () => {
  renderWithState(locationState);
  await waitFor(() => expect(screen.getByText(/2 \+ 2\?/)).toBeInTheDocument());

  fireEvent.click(screen.getByText("4"));
  fireEvent.click(screen.getByText("Submit quiz"));

  await waitFor(() => expect(submitAttempt).toHaveBeenCalledWith("attempt-1", [
    { question_id: "q1", selected_option_id: "a" },
  ]));
});