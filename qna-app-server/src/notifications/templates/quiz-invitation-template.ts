export interface QuizInvitationPayload {
  title: string;
  durationMinutes: number;
  deadline: Date;
}

export function QuizReminderTemplate(
  payload: QuizInvitationPayload,
  link: string
) {
  const deadline = payload.deadline.toLocaleString();

  return {
    subject: `Reminder: complete ${payload.title}`,
    body: `<div style="font-family:Arial,sans-serif;color:#172033;max-width:560px;margin:auto"><h2 style="color:#1769aa">Your quiz is waiting</h2><p>This is a reminder to complete <strong>${payload.title}</strong>.</p><p>You have ${payload.durationMinutes} minutes, and access closes on ${deadline}.</p><p><a href="${link}" style="display:inline-block;background:#1769aa;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Open quiz</a></p><p style="font-size:12px;color:#667085">If you have already completed this quiz, you can ignore this reminder.</p></div>`
  };
}

export function QuizInvitationTemplate(
  payload: string | QuizInvitationPayload,
  link: string
) {
  const quiz =
    typeof payload === "string"
      ? { title: payload, durationMinutes: 0, deadline: null }
      : payload;
  const duration = quiz.durationMinutes
    ? `${quiz.durationMinutes} minutes`
    : "the scheduled duration";
  const deadline = quiz.deadline
    ? quiz.deadline.toLocaleString()
    : "the quiz deadline";

  return {
    subject: `Quiz Invitation: ${quiz.title}`,
    body: `<div><h2>You are invited to ${quiz.title}</h2><p>Duration: ${duration}</p><p>Deadline: ${deadline}</p><p>Click here to start: <a href="${link}">Start Quiz</a></p></div>`
  };
}
