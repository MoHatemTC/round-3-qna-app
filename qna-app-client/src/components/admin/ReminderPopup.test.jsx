import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ReminderPopup from "./ReminderPopup";

const invitations = [
  { id: "sent-1", email: "waiting@example.com", status: "sent" },
  { id: "accepted-1", email: "finished@example.com", status: "accepted" },
  { id: "sent-2", email: "another@example.com", status: "sent" },
];

describe("ReminderPopup", () => {
  it("shows only sent invitations and filters them by email", () => {
    render(<ReminderPopup invitations={invitations} onClose={vi.fn()} onRemind={vi.fn()} />);

    expect(screen.getByText("waiting@example.com")).toBeInTheDocument();
    expect(screen.getByText("another@example.com")).toBeInTheDocument();
    expect(screen.queryByText("finished@example.com")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search student emails"), { target: { value: "another" } });
    expect(screen.getByText("another@example.com")).toBeInTheDocument();
    expect(screen.queryByText("waiting@example.com")).not.toBeInTheDocument();
  });

  it("returns only checked email addresses when reminding", () => {
    const onRemind = vi.fn();
    render(<ReminderPopup invitations={invitations} onClose={vi.fn()} onRemind={onRemind} />);

    fireEvent.click(screen.getByLabelText("Remind waiting@example.com"));
    fireEvent.click(screen.getByRole("button", { name: "Remind" }));

    expect(onRemind).toHaveBeenCalledWith(["waiting@example.com"]);
  });

  it("optimistically removes selected students while reminding", () => {
    const onRemind = vi.fn(() => new Promise(() => {}));
    render(<ReminderPopup invitations={invitations} onClose={vi.fn()} onRemind={onRemind} />);

    fireEvent.click(screen.getByLabelText("Remind waiting@example.com"));
    fireEvent.click(screen.getByRole("button", { name: "Remind" }));

    expect(screen.queryByText("waiting@example.com")).not.toBeInTheDocument();
  });
});