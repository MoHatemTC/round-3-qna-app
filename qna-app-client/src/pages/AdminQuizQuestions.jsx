import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

// Admin: Questions for a single quiz. Nested under /admin-panel/quizzes/:quizId/questions
// (see src/utils/proxy.jsx for why admin routes must live under /admin-panel).
// Requires an admin session cookie, same as AdminQuizzes.jsx.

function emptyOptionsFor(type) {
  return type === "true_false"
    ? [
        { text: "True", is_correct: false },
        { text: "False", is_correct: false },
      ]
    : [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ]
}

function emptyQuestionForm() {
  return { type: "mcq", text: "", points: "1", options: emptyOptionsFor("mcq") }
}

function toFormState(question) {
  return {
    type: question.type,
    text: question.text,
    points: String(question.points),
    options: question.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
  }
}

function validateForm(form) {
  if (!form.text.trim()) return "Question text is required"
  if (!form.points || Number(form.points) < 1) return "Points must be greater than 0"

  const correctCount = form.options.filter((o) => o.is_correct).length

  if (form.type === "mcq") {
    if (form.options.length < 2) return "MCQ questions need at least two options"
    if (form.options.some((o) => !o.text.trim())) return "Every option needs text"
    if (correctCount !== 1) return "MCQ questions need exactly one correct option"
  } else {
    if (correctCount !== 1) return "True/false questions need exactly one correct value"
  }

  return ""
}

function QuestionForm({ initial, onCancel, onSubmit, saving, title }) {
  const [form, setForm] = useState(initial ?? emptyQuestionForm())
  const [error, setError] = useState("")

  function setType(type) {
    setForm((f) => ({ ...f, type, options: emptyOptionsFor(type) }))
  }

  function setOptionText(index, text) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === index ? { ...o, text } : o)),
    }))
  }

  function setCorrectOption(index) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === index })),
    }))
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { text: "", is_correct: false }] }))
  }

  function removeOption(index) {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    onSubmit(
      {
        type: form.type,
        text: form.text,
        points: Number(form.points),
        options: form.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
      },
      setError
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close form"
        >
          <X className="size-4" />
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor="q-text">
            Question text
          </label>
          <textarea
            id="q-text"
            rows={2}
            required
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor="q-points">
            Points
          </label>
          <input
            id="q-points"
            type="number"
            min={1}
            required
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">Type</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={form.type === "mcq" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("mcq")}
          >
            Multiple choice
          </Button>
          <Button
            type="button"
            variant={form.type === "true_false" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("true_false")}
          >
            True / False
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">
          Options (pick the correct one)
        </span>
        <div className="space-y-2">
          {form.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={option.is_correct}
                onChange={() => setCorrectOption(index)}
                aria-label={`Mark option ${index + 1} correct`}
                className="size-4 accent-primary"
              />
              <input
                value={option.text}
                readOnly={form.type === "true_false"}
                onChange={(e) => setOptionText(index, e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 read-only:bg-muted"
              />
              {form.type === "mcq" && form.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeOption(index)}
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
        </div>
        {form.type === "mcq" && (
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus /> Add option
          </Button>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save question"}
        </Button>
      </div>
    </form>
  )
}

function QuestionRow({ question, onEdit, onDelete }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {question.type === "mcq" ? "Multiple choice" : "True / False"}
            </span>
            <span className="text-xs text-muted-foreground">
              {question.points} {question.points === 1 ? "point" : "points"}
            </span>
          </div>
          <p className="text-sm text-foreground">{question.text}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Edit question"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete question"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <ul className="space-y-1">
        {question.options.map((option) => (
          <li
            key={option.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {option.is_correct ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <span className="size-3.5" />
            )}
            <span className={option.is_correct ? "text-foreground" : undefined}>
              {option.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminQuizQuestions() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [quizData, questionsData] = await Promise.all([
        api.get(`/admin/quizzes/${quizId}`),
        api.get(`/admin/quizzes/${quizId}/questions`),
      ])
      setQuiz(quizData)
      setQuestions(questionsData)
      setPageError("")
    } catch (err) {
      setPageError(err.message)
      if (err.status === 404) {
        setQuiz(null)
        setQuestions([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  async function handleCreate(payload, setFormError) {
    setSaving(true)
    try {
      await api.post(`/admin/quizzes/${quizId}/questions`, payload)
      setShowAddForm(false)
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(questionId, payload, setFormError) {
    setSaving(true)
    try {
      await api.put(`/admin/quizzes/${quizId}/questions/${questionId}`, payload)
      setEditingId(null)
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(questionId) {
    if (!window.confirm("Delete this question? This cannot be undone.")) return
    try {
      await api.delete(`/admin/quizzes/${quizId}/questions/${questionId}`)
      await load()
    } catch (err) {
      setPageError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin-panel")}>
            <ArrowLeft /> Back to quizzes
          </Button>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            {loading ? "Loading..." : quiz ? `Questions: ${quiz.title}` : "Quiz not found"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Add, edit and remove questions and their options.
          </p>
        </div>
        {quiz && !showAddForm && (
          <Button
            onClick={() => {
              setEditingId(null)
              setShowAddForm(true)
            }}
          >
            <Plus /> Add question
          </Button>
        )}
      </div>

      {pageError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {pageError}
          {pageError && (
            <>
              {" "}
              <Link to="/admin-panel" className="font-medium underline underline-offset-2">
                Back to quizzes
              </Link>
            </>
          )}
        </p>
      )}

      {showAddForm && (
        <QuestionForm
          title="New question"
          saving={saving}
          onCancel={() => setShowAddForm(false)}
          onSubmit={handleCreate}
        />
      )}

      <div className="space-y-3">
        {loading && <p className="text-center text-muted-foreground">Loading questions...</p>}

        {!loading && quiz && questions.length === 0 && !showAddForm && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            No questions yet. Add one to get started.
          </p>
        )}

        {questions.map((question) =>
          editingId === question.id ? (
            <QuestionForm
              key={question.id}
              title="Edit question"
              initial={toFormState(question)}
              saving={saving}
              onCancel={() => setEditingId(null)}
              onSubmit={(payload, setFormError) =>
                handleUpdate(question.id, payload, setFormError)
              }
            />
          ) : (
            <QuestionRow
              key={question.id}
              question={question}
              onEdit={() => {
                setShowAddForm(false)
                setEditingId(question.id)
              }}
              onDelete={() => handleDelete(question.id)}
            />
          )
        )}
      </div>
    </div>
  )
}
