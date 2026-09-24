// Shared vocabulary and request helpers for the question bank, used by the
// Question Bank page and the "Select from question bank" picker.

export const QUESTION_TYPE_LABELS = {
  mcq: "Multiple choice",
  true_false: "True / False",
}

export const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

export const DIFFICULTY_STYLES = {
  easy: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
}

export const emptyBankFilters = {
  search: "",
  type: "",
  difficulty: "",
  category: "",
  tag: "",
  created_from: "",
  created_to: "",
}

export function hasActiveFilters(filters) {
  return Object.keys(emptyBankFilters).some((key) => filters[key])
}

// GET /admin/questions query string. Empty filters are left out so the server
// doesn't reject blank enum values.
export function bankQueryString(filters, { page = 1, pageSize = 20, excludeQuizId } = {}) {
  const params = new URLSearchParams()
  if (filters.search.trim()) params.set("search", filters.search.trim())
  if (filters.type) params.set("type", filters.type)
  if (filters.difficulty) params.set("difficulty", filters.difficulty)
  if (filters.category) params.set("category", filters.category)
  if (filters.tag) params.set("tags", filters.tag)
  if (filters.created_from) params.set("created_from", filters.created_from)
  if (filters.created_to) params.set("created_to", filters.created_to)
  if (excludeQuizId) params.set("exclude_quiz_id", excludeQuizId)
  params.set("page", String(page))
  params.set("page_size", String(pageSize))
  return params.toString()
}

// Quizzes in which a change to this question would matter right now:
// published and not yet ended.
export function activeUsages(question, now = new Date()) {
  return (question.quizzes ?? []).filter(
    ({ quiz }) => quiz.status === "published" && new Date(quiz.ends_at) > now
  )
}

// A stored question as QuestionForm state (numbers and lists become text).
export function toFormState(question) {
  return {
    type: question.type,
    text: question.text,
    points: String(question.points),
    options: question.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
    difficulty: question.difficulty ?? "medium",
    category: question.category ?? "",
    tags: (question.tags ?? []).join(", "),
    explanation: question.explanation ?? "",
  }
}
