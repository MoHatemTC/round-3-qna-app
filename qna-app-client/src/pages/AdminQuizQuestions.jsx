import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import { ArrowLeft, Check, CircleAlert, Lock, Pencil, Plus, Trash2, X } from "lucide-react"
import { api } from "@/lib/api"
import { updateQuiz } from "@/services/services"
import { formatDateTime, isQuizLive, quizToPayload } from "@/lib/quizStatus"
import { useNow } from "@/hooks/useNow"
import { Button } from "@/components/ui/button"
import QuizStatusBadge from "@/components/admin/QuizStatusBadge"
import PublishSwitch from "@/components/admin/PublishSwitch"
import { AdminCard, AdminPageHeader, adminPrimaryButton } from "@/components/admin/AdminLayout"

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
      className="space-y-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close form"
        >
          <X className="size-4" />
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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
            className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
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
            className="w-24 rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
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
                className="size-4 accent-orange-600"
              />
              <input
                value={option.text}
                readOnly={form.type === "true_false"}
                onChange={(e) => setOptionText(index, e.target.value)}
                aria-label={`Option ${index + 1}`}
                className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring read-only:bg-muted"
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

function QuestionRow({ number, question, locked, onEdit, onDelete }) {
  return (
    <div className="space-y-2 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
              {number}
            </span>
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
            disabled={locked}
            title={locked ? "Locked while the quiz is live" : undefined}
            aria-label={`Edit question ${number}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            disabled={locked}
            title={locked ? "Locked while the quiz is live" : undefined}
            aria-label={`Delete question ${number}`}
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
              <Check className="size-3.5 text-green-600" aria-label="Correct answer" />
            ) : (
              <span className="size-3.5" />
            )}
            <span className={option.is_correct ? "font-medium text-foreground" : undefined}>
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
  const location = useLocation()
  const justCreated = Boolean(location.state?.justCreated)
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const [showAddForm, setShowAddForm] = useState(justCreated)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const now = useNow()

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

  async function handleTogglePublish() {
    setPublishing(true)
    setPageError("")
    try {
      const status = quiz.status === "published" ? "draft" : "published"
      await updateQuiz(quiz.id, quizToPayload(quiz, { status }))
      await load()
    } catch (err) {
      setPageError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  // Keep the status badge in sync with the question list we just loaded.
  const quizWithCount = quiz && {
    ...quiz,
    _count: { ...quiz._count, questions: questions.length },
  }
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0)
  // Students may be mid-attempt, so the server rejects question changes while live.
  const locked = Boolean(quiz && isQuizLive(quiz, now))

  return (
    <>
      <Link
        to="/admin-panel/quizzes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to quizzes
      </Link>

      <AdminPageHeader
        eyebrow="Questions"
        title={loading ? "Loading..." : quiz ? quiz.title : "Quiz not found"}
        description="Add, edit and remove questions and their options."
        actions={
          quiz &&
          !showAddForm &&
          !locked && (
            <button
              type="button"
              className={adminPrimaryButton}
              onClick={() => {
                setEditingId(null)
                setShowAddForm(true)
              }}
            >
              <Plus /> Add question
            </button>
          )
        }
      />

      {pageError && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </p>
      )}

      {quizWithCount && (
        <AdminCard className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <QuizStatusBadge quiz={quizWithCount} />
            <p className="text-sm text-muted-foreground">
              {questions.length} {questions.length === 1 ? "question" : "questions"} · {totalPoints}{" "}
              {totalPoints === 1 ? "point" : "points"} · {quiz.duration_minutes} min
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span>{quiz.status === "published" ? "Published" : "Draft"}</span>
            <PublishSwitch quiz={quizWithCount} busy={publishing} onToggle={handleTogglePublish} />
          </div>
        </AdminCard>
      )}

      {locked && (
        <div className="mb-6 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/30">
          <Lock className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold">Questions are locked while this quiz is live</p>
            <p className="mt-0.5 text-blue-800/80 dark:text-blue-200/80">
              Students may be taking it right now. It closes {formatDateTime(quiz.ends_at)} — to make
              changes before then, switch it back to draft first.
            </p>
          </div>
        </div>
      )}

      {quiz && !loading && questions.length === 0 && (
        <div className="mb-6 flex gap-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-900 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/30">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-orange-600" />
          <div>
            <p className="font-semibold">
              {justCreated ? "Quiz created — now add its first question" : "This quiz has no questions yet"}
            </p>
            <p className="mt-0.5 text-orange-800/80 dark:text-orange-200/80">
              A quiz needs at least one question before it can be published and become active for students.
            </p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="mb-4">
          <QuestionForm
            title="New question"
            saving={saving}
            onCancel={() => setShowAddForm(false)}
            onSubmit={handleCreate}
          />
        </div>
      )}

      <div className="space-y-3">
        {loading && <p className="text-center text-muted-foreground">Loading questions...</p>}

        {!loading && quiz && questions.length === 0 && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground transition-colors hover:border-orange-400 hover:text-foreground"
          >
            <Plus className="size-5 text-orange-600" />
            <span className="font-semibold">Add your first question</span>
          </button>
        )}

        {questions.map((question, index) =>
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
              number={index + 1}
              question={question}
              locked={locked}
              onEdit={() => {
                setShowAddForm(false)
                setEditingId(question.id)
              }}
              onDelete={() => handleDelete(question.id)}
            />
          )
        )}
      </div>
    </>
  )
}
