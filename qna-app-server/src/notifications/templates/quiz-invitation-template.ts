export interface QuizInvitationPayload {
  title: string;
  durationMinutes: number;
  deadline: Date;
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
