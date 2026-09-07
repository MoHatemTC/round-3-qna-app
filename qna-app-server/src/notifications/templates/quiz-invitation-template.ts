export function QuizInvitationTemplate(quizTitle: string, link: string) {
  return {
    subject: `Quiz Invitation: ${quizTitle}`,
    body: `<div><h2>You are invited!</h2><p>Click here to start: <a href="${link}">Start Quiz</a></p></div>`
  };
}
