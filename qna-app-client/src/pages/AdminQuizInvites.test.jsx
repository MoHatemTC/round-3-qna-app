import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import AdminQuizInvites from "./AdminQuizInvites";
import { summarizeInvitationResult } from "@/lib/invitationSummary";

vi.mock("@/services/services", () => ({
  getQuiz: vi.fn(),
  getQuizInvitations: vi.fn(),
  sendQuizInvitations: vi.fn(),
}));

import { getQuiz, getQuizInvitations, sendQuizInvitations } from "@/services/services";

// POST /admin/quizzes/:id/invitations always answers 200 and reports the
// outcome per recipient, so the page has to read the counts. Reporting a
// failed delivery as a success is the bug these tests pin down.
describe("summarizeInvitationResult", () => {
  it("treats a delivered invitation as a success", () => {
    const outcome = summarizeInvitationResult({ sent: 1, failed: 0, skipped: 0, invalid: 0 });
    expect(outcome.ok).toBe(true);
    expect(outcome.text).toContain("Invitation sent to 1 student");
  });

  it("does not call a failed delivery a success", () => {
    const outcome = summarizeInvitationResult({
      sent: 0,
      failed: 1,
      skipped: 0,
      invalid: 0,
      failures: [{ email: "avery@example.com", reason: "550 Recipient rejected" }],
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.text).toContain("could not be delivered");
    expect(outcome.text).toContain("550 Recipient rejected");
    expect(outcome.text).not.toMatch(/success/i);
  });

  it("flags a malformed address separately from a delivery failure", () => {
    const outcome = summarizeInvitationResult({
      sent: 0,
      failed: 0,
      skipped: 0,
      invalid: 1,
      invalid_emails: ["not-an-email"],
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.text).toContain("valid email address");
  });

  it("summarizes successful and invalid recipients in the same batch", () => {
    const outcome = summarizeInvitationResult({
      sent: 9,
      failed: 0,
      skipped: 0,
      invalid: 1,
      invalid_emails: ["not-an-email"],
    });

    expect(outcome.text).toBe("Sent to 9 students. 1 address is invalid: not-an-email.");
  });

  it("explains a skipped duplicate without claiming a second email went out", () => {
    const outcome = summarizeInvitationResult({ sent: 0, failed: 0, skipped: 1, invalid: 0 });
    expect(outcome.ok).toBe(true);
    expect(outcome.text).toContain("already been invited");
  });

  it("does not claim success when nothing at all happened", () => {
    const outcome = summarizeInvitationResult({ sent: 0, failed: 0, skipped: 0, invalid: 0 });
    expect(outcome.ok).toBe(false);
  });

  it("tolerates a missing response body", () => {
    expect(summarizeInvitationResult(undefined).ok).toBe(false);
  });
});

const publishedQuiz = {
  id: "quiz-1",
  title: "TypeScript Foundations",
  status: "published",
  duration_minutes: 35,
  starts_at: new Date(Date.now() + 3_600_000).toISOString(),
  ends_at: new Date(Date.now() + 7_200_000).toISOString(),
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin-panel/quizzes/quiz-1/invites"]}>
      <Routes>
        <Route path="/admin-panel/quizzes/:quizId/invites" element={<AdminQuizInvites />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminQuizInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getQuiz.mockResolvedValue(publishedQuiz);
    getQuizInvitations.mockResolvedValue([]);
  });

  it("reports a failed invitation as an error, not a success", async () => {
    sendQuizInvitations.mockResolvedValue({
      sent: 0,
      failed: 1,
      skipped: 0,
      invalid: 0,
      failures: [{ email: "avery@example.com", reason: "550 Recipient rejected" }],
    });
    renderPage();

    const field = await screen.findByLabelText(/student email/i);
    fireEvent.change(field, { target: { value: "avery@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/could not be delivered/i);
    expect(screen.queryByText(/processed successfully/i)).not.toBeInTheDocument();
  });

  it("keeps a rejected address in the field so it can be corrected", async () => {
    sendQuizInvitations.mockResolvedValue({
      sent: 0,
      failed: 0,
      skipped: 0,
      invalid: 1,
      invalid_emails: ["not-an-email"],
    });
    renderPage();

    const field = await screen.findByLabelText(/student email/i);
    // type="email" would block submit in a browser; the server-side check is
    // what this exercises, so the value is set directly.
    fireEvent.change(field, { target: { value: "bad@example" } });
    fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

    await screen.findByRole("alert");
    expect(field).toHaveValue("bad@example");
  });

  it("confirms a delivered invitation and clears the field", async () => {
    sendQuizInvitations.mockResolvedValue({
      sent: 1,
      failed: 0,
      skipped: 0,
      invalid: 0,
      failures: [],
    });
    renderPage();

    const field = await screen.findByLabelText(/student email/i);
    fireEvent.change(field, { target: { value: "avery@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/Invitation sent to 1 student/i);
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("refuses to send from a draft quiz", async () => {
    getQuiz.mockResolvedValue({ ...publishedQuiz, status: "draft" });
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /send invitation/i })).toBeDisabled()
    );
    expect(screen.getByText(/this quiz is a draft/i)).toBeInTheDocument();
    expect(sendQuizInvitations).not.toHaveBeenCalled();
  });

  it("closes invitations once the quiz has ended", async () => {
    getQuiz.mockResolvedValue({
      ...publishedQuiz,
      starts_at: new Date(Date.now() - 7_200_000).toISOString(),
      ends_at: new Date(Date.now() - 3_600_000).toISOString(),
    });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(/invitations are closed/i);
    expect(screen.getByRole("button", { name: /send invitation/i })).toBeDisabled();
  });

  it("lists the invitations returned for the quiz", async () => {
    getQuizInvitations.mockResolvedValue([
      {
        id: "inv-1",
        email: "avery.morgan@example.com",
        status: "sent",
        sent_at: new Date().toISOString(),
        accepted_at: null,
        user: { id: "user-1", name: "Avery Morgan", email: "avery.morgan@example.com" },
      },
      {
        id: "inv-2",
        email: "jordan.lee@example.com",
        status: "failed",
        sent_at: null,
        accepted_at: null,
        user: null,
      },
    ]);
    renderPage();

    expect(await screen.findByText("avery.morgan@example.com")).toBeInTheDocument();
    expect(screen.getByText("Avery Morgan")).toBeInTheDocument();
    expect(screen.getByText("jordan.lee@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Invitations \(2\)/)).toBeInTheDocument();
    // A failed invitation has no send time to show.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
