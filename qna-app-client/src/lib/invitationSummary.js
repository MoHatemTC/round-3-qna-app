// POST /admin/quizzes/:id/invitations always answers 200 with a per-recipient
// summary, so the HTTP status says nothing about whether the student was
// actually invited. Both the wording and the tone have to come from the counts.
//
// See qna-app-server/QUIZZES_API.md for the response shape.
export function summarizeInvitationResult(result) {
  const {
    sent = 0,
    failed = 0,
    skipped = 0,
    invalid = 0,
    invalid_emails = [],
    failures = [],
  } = result ?? {}

  if (invalid > 0) {
    if (sent === 0) {
      return {
        ok: false,
        text: "That doesn't look like a valid email address. Check it and try again.",
      }
    }
    const sentText = sent > 0
      ? `Sent to ${sent} student${sent === 1 ? "" : "s"}. `
      : ""
    const invalidAddresses = invalid_emails.length > 0
      ? `: ${invalid_emails.join(", ")}`
      : ""
    return {
      ok: false,
      text: `${sentText}${invalid} address${invalid === 1 ? "" : "es"} ${invalid === 1 ? "is" : "are"} invalid${invalidAddresses}.`,
    }
  }
  if (failed > 0) {
    const reason = failures[0]?.reason
    return {
      ok: false,
      text: `The invitation could not be delivered${reason ? ` (${reason})` : ""}. The student has not been invited — check the address and try again.`,
    }
  }
  if (skipped > 0) {
    return {
      ok: true,
      text: "That student has already been invited to this quiz, so no second email was sent.",
    }
  }
  if (sent > 0) {
    return {
      ok: true,
      text: `Invitation sent to ${sent} student${sent === 1 ? "" : "s"}.`,
    }
  }
  return { ok: false, text: "No invitation was sent — add a student email address first." }
}
