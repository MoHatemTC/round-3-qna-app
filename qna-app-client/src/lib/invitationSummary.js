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

  const parts = []
  if (sent) parts.push(`Sent to ${sent} student${sent === 1 ? "" : "s"}.`)
  if (invalid) {
    parts.push(
      `${invalid} address${invalid === 1 ? " is" : "es are"} invalid${invalid_emails.length ? `: ${invalid_emails.join(", ")}` : ""}.`,
    )
  }
  if (failed) {
    parts.push(
      `${failed} could not be delivered${failures[0]?.reason ? ` (${failures[0].reason})` : ""}.`,
    )
  }
  if (skipped) parts.push(`${skipped} already invited.`)

  return {
    ok: sent > 0 && !failed && !invalid,
    text: parts.join(" ") || "No invitation was sent — add a student email address first.",
  }
}
