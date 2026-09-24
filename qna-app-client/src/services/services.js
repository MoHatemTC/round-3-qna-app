import { api } from "@/lib/api"

// All the quiz-related API calls in one place, built on the shared api
// client (src/lib/api.js). Pages import these named functions instead of
// calling api.get/post/put/delete directly.

export function getQuizzes() {
  return api.get("/admin/quizzes")
}

export function getQuiz(id) {
  return api.get(`/admin/quizzes/${id}`)
}

export function createQuiz(data) {
  return api.post("/admin/quizzes", data)
}

export function updateQuiz(id, data) {
  return api.put(`/admin/quizzes/${id}`, data)
}

export function deleteQuiz(id) {
  return api.delete(`/admin/quizzes/${id}`)
}

export function publishQuiz(id) {
  return api.post(`/admin/quizzes/${id}/publish`, {})
}

export function unpublishQuiz(id) {
  return api.post(`/admin/quizzes/${id}/unpublish`, {})
}

export function getQuizInvitations(id) {
  return api.get(`/admin/quizzes/${id}/invitations`)
}

export function sendQuizInvitations(id, emails) {
  return api.post(`/admin/quizzes/${id}/invitations`, { emails, userIds: [] })
}

export function logout() {
  return api.post("/auth/logout", {})
}

export function startAttempt(quizId) {
  return api.post("/attempts/start", { quiz_id: quizId })
}

export function submitAttempt(attemptId, answersPayload) {
  return api.post(`/attempts/${attemptId}/submit`, { answers: answersPayload })
}

export function getAttemptResult(attemptId) {
  return api.get(`/attempts/${attemptId}/result`)
}

export function getNotifications() {
  return api.get("/student/notifications")
}

export function markNotificationRead(id) {
  return api.post(`/student/notifications/${id}/read`, {})
}

export function markAllNotificationsRead() {
  return api.post("/student/notifications/read-all", {})
}

export function getAdminAttempts() {
  return api.get("/attempts/admin/attempts")
}

// A quiz's questions. Each one is a question-bank question linked to the quiz.

export function getQuizQuestions(quizId) {
  return api.get(`/admin/quizzes/${quizId}/questions`)
}

// Creates the question in the bank and adds it to the end of the quiz.
export function createQuizQuestion(quizId, data) {
  return api.post(`/admin/quizzes/${quizId}/questions`, data)
}

export function attachBankQuestions(quizId, questionIds) {
  return api.post(`/admin/quizzes/${quizId}/questions/attach`, { question_ids: questionIds })
}

export function reorderQuizQuestions(quizId, questionIds) {
  return api.post(`/admin/quizzes/${quizId}/questions/reorder`, { question_ids: questionIds })
}

// Edits the bank question, so every quiz using it changes.
export function updateQuizQuestion(quizId, questionId, data) {
  return api.put(`/admin/quizzes/${quizId}/questions/${questionId}`, data)
}

// Removes the question from this quiz only; it stays in the bank.
export function removeQuizQuestion(quizId, questionId) {
  return api.delete(`/admin/quizzes/${quizId}/questions/${questionId}`)
}

// The question bank.

export function searchQuestionBank(queryString) {
  return api.get(`/admin/questions?${queryString}`)
}

export function getQuestionBankFacets() {
  return api.get("/admin/questions/facets")
}

export function createBankQuestion(data) {
  return api.post("/admin/questions", data)
}

export function updateBankQuestion(id, data) {
  return api.put(`/admin/questions/${id}`, data)
}

// Soft delete. Without force the server refuses (409) while a published quiz
// that hasn't ended still uses the question.
export function deleteBankQuestion(id, { force = false } = {}) {
  return api.delete(`/admin/questions/${id}${force ? "?force=true" : ""}`)
}
