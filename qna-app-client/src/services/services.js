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

export function logout() {
  return api.post("/auth/logout", {})
}
