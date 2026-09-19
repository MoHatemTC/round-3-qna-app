export const StudentQuizStatus = {
  in_progress: "in_progress",
  submitted: "submitted",
  auto_submitted: "auto_submitted",
  not_started: "not_started"
} as const;

export type StudentQuizStatus =
  (typeof StudentQuizStatus)[keyof typeof StudentQuizStatus];