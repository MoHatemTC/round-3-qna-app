import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { CircleAlert, Clock, ListChecks, Mail, Pencil, Plus, Trash2, X } from "lucide-react"
import {
  createQuiz,
  deleteQuiz,
  getQuizzes,
  publishQuiz,
  unpublishQuiz,
  updateQuiz,
} from "@/services/services"
import { Button, buttonVariants } from "@/components/ui/button"
import QuizStatusBadge from "@/components/admin/QuizStatusBadge"
import PublishSwitch from "@/components/admin/PublishSwitch"
import PublishStateBadge from "@/components/admin/PublishStateBadge"
import {
  AdminCard,
  AdminPageHeader,
  adminInput,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin/AdminLayout"
import {
  formatDateTime,
  formatDuration,
  hasEnded,
  localTimeZone,
  questionCount,
  quizWindowState,
  scheduleProblems,
} from "@/lib/quizStatus"
import { useNow } from "@/hooks/useNow"

// Admin: quiz list + create/edit form. Requires an admin session cookie -
// a student session gets a 403 from the API.

const emptyForm = {
  title: "",
  description: "",
  duration_minutes: "",
  starts_at: "",
  ends_at: "",
  status: "draft",
}

function toDatetimeLocal(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function WindowLabel({ quiz, now }) {
  const state = quizWindowState(quiz, now)
  const styles = {
    upcoming: "text-blue-700 dark:text-blue-300",
    open: "text-green-700 dark:text-green-400",
    closed: "text-red-700 dark:text-red-400",
  }
  const text = {
    upcoming: `Opens in ${formatDuration(new Date(quiz.starts_at) - now)}`,
    open: `Open · closes in ${formatDuration(new Date(quiz.ends_at) - now)}`,
    closed: "Ended",
  }
  return <p className={`mt-1 font-semibold ${styles[state]}`}>{text[state]}</p>
}

function ScheduleSummary({ form, problems }) {
  if (!form.starts_at || !form.ends_at) {
    return (
      <p className="text-xs text-muted-foreground">
        Times are in your local time zone ({localTimeZone}).
      </p>
    )
  }

  if (problems.length) {
    return (
      <ul role="alert" className="space-y-1 text-sm text-destructive">
        {problems.map((problem) => (
          <li key={problem} className="flex gap-2">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {problem}
          </li>
        ))}
      </ul>
    )
  }

  const windowMs = new Date(form.ends_at) - new Date(form.starts_at)
  const opensIn = new Date(form.starts_at) - new Date()

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <Clock className="size-3.5" />
      <span>
        Open for <strong className="text-foreground">{formatDuration(windowMs)}</strong>
        {opensIn > 0 ? <>, opens in <strong className="text-foreground">{formatDuration(opensIn)}</strong></> : ", already open"}
        {form.duration_minutes && <>. Each student gets {form.duration_minutes} min, or until the window closes — whichever comes first.</>}
      </span>
      <span>({localTimeZone})</span>
    </p>
  )
}

function QuizForm({ form, setForm, editingQuiz, saving, error, onCancel, onSubmit }) {
  const hasQuestions = editingQuiz && questionCount(editingQuiz) > 0
  const problems = scheduleProblems(form, {
    isNew: !editingQuiz,
    publishing: form.status === "published",
  })

  return (
    <AdminCard className="mb-8 p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{editingQuiz ? "Edit quiz" : "New quiz"}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close form"
          >
            <X className="size-4" />
          </button>
        </div>

        {!hasQuestions && (
          <div className="flex gap-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-900 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/30">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-orange-600" />
            <div>
              <p className="font-semibold">A quiz needs at least one question</p>
              <p className="mt-0.5 text-orange-800/80 dark:text-orange-200/80">
                {editingQuiz
                  ? "This quiz has no questions yet, so it stays a draft. Add a question to publish it."
                  : "Your quiz is saved as a draft. Next, you'll add its questions — once it has at least one, you can publish it."}
              </p>
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div>
          <label className="text-sm font-medium" htmlFor="title">Title</label>
          <input
            id="title"
            required
            placeholder="JavaScript Fundamentals"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={adminInput}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={2}
            placeholder="What does this quiz cover?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={adminInput}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium" htmlFor="duration">Duration (minutes)</label>
            <input
              id="duration"
              type="number"
              min={1}
              required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              className={adminInput}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="starts_at">Starts at</label>
            <input
              id="starts_at"
              type="datetime-local"
              required
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              className={adminInput}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ends_at">Ends at</label>
            <input
              id="ends_at"
              type="datetime-local"
              required
              value={form.ends_at}
              min={form.starts_at || undefined}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              className={adminInput}
            />
          </div>
        </div>

        <ScheduleSummary form={form} problems={problems} />

        {editingQuiz && (
          <div>
            <label className="text-sm font-medium" htmlFor="status">Status</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={adminInput}
            >
              <option value="draft">Draft</option>
              <option value="published" disabled={!hasQuestions}>
                Published{hasQuestions ? "" : " (add a question first)"}
              </option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={adminSecondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={saving || problems.length > 0} className={adminPrimaryButton}>
            {saving ? "Saving..." : editingQuiz ? "Save changes" : "Create & add questions"}
          </button>
        </div>
      </form>
    </AdminCard>
  )
}

export default function AdminQuizzes() {
  const navigate = useNavigate()
  const location = useLocation()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const [showForm, setShowForm] = useState(Boolean(location.state?.openCreate))
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const now = useNow()

  async function loadQuizzes() {
    try {
      const data = await getQuizzes()
      setQuizzes(Array.isArray(data) ? data : [])
      setPageError("")
    } catch (err) {
      setPageError(
        err.status === 403
          ? "You're signed in, but this account isn't an admin."
          : err.message || "Unable to load quizzes."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount: state is only set inside loadQuizzes after its
    // await resolves. The compiler-backed lint rule can't see past that.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuizzes()
  }, [])

  function openCreateForm() {
    setEditingQuiz(null)
    setForm(emptyForm)
    setFormError("")
    setShowForm(true)
  }

  function openEditForm(quiz) {
    setEditingQuiz(quiz)
    setForm({
      title: quiz.title,
      description: quiz.description ?? "",
      duration_minutes: String(quiz.duration_minutes),
      starts_at: toDatetimeLocal(quiz.starts_at),
      ends_at: toDatetimeLocal(quiz.ends_at),
      status: quiz.status,
    })
    setFormError("")
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function closeForm() {
    setShowForm(false)
    setEditingQuiz(null)
    setFormError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError("")
    setSaving(true)

    const payload = {
      title: form.title,
      description: form.description || undefined,
      duration_minutes: Number(form.duration_minutes),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
      status: editingQuiz ? form.status : "draft",
    }

    try {
      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, payload)
        closeForm()
        await loadQuizzes()
      } else {
        const created = await createQuiz(payload)
        navigate(`/admin-panel/quizzes/${created.id}/questions`, { state: { justCreated: true } })
      }
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(quiz) {
    setTogglingId(quiz.id)
    setPageError("")
    try {
      if (quiz.status === "published") await unpublishQuiz(quiz.id)
      else await publishQuiz(quiz.id)
      await loadQuizzes()
    } catch (err) {
      setPageError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return
    try {
      await deleteQuiz(id)
      await loadQuizzes()
    } catch (err) {
      setPageError(err.message)
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quizzes"
        title="Manage quizzes"
        description="Create quizzes, add their questions, and control when they're active."
        actions={
          !showForm && (
            <button type="button" onClick={openCreateForm} className={adminPrimaryButton}>
              <Plus /> New quiz
            </button>
          )
        }
      />

      {pageError && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </p>
      )}

      {showForm && (
        <QuizForm
          form={form}
          setForm={setForm}
          editingQuiz={editingQuiz}
          saving={saving}
          error={formError}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-green-500" /> Active — students can take it
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-red-500" /> Inactive — draft, no questions, or ended
        </span>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Quiz</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Questions</th>
                <th className="px-5 py-3 font-medium">Window</th>
                <th className="px-5 py-3 font-medium">Draft / Published</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Loading quizzes...
                  </td>
                </tr>
              )}

              {!loading && quizzes.length === 0 && !pageError && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No quizzes yet. Create one to get started.
                  </td>
                </tr>
              )}

              {quizzes.map((quiz) => {
                const count = questionCount(quiz)
                return (
                  <tr key={quiz.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{quiz.title}</p>
                        <PublishStateBadge status={quiz.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {quiz.duration_minutes} min · {quiz._count?.invitations ?? 0} invited
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <QuizStatusBadge quiz={quiz} />
                    </td>
                    <td className="px-5 py-4">
                      {count === 0 ? (
                        <Link
                          to={`/admin-panel/quizzes/${quiz.id}/questions`}
                          className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline dark:text-red-400"
                        >
                          <Plus className="size-3.5" /> Add a question
                        </Link>
                      ) : (
                        <span className="font-semibold">{count}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      <p>{formatDateTime(quiz.starts_at)}</p>
                      <p>→ {formatDateTime(quiz.ends_at)}</p>
                      <WindowLabel quiz={quiz} now={now} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <PublishSwitch
                          quiz={quiz}
                          busy={togglingId === quiz.id}
                          onToggle={handleTogglePublish}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {togglingId === quiz.id
                            ? "Saving..."
                            : quiz.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin-panel/quizzes/${quiz.id}/questions`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`Questions for ${quiz.title}`}
                          title="Manage questions"
                        >
                          <ListChecks />
                        </Link>
                        {hasEnded(quiz, now) ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled
                            aria-label={`Invites closed for ${quiz.title}`}
                            title="This quiz has ended — extend its end time to invite students"
                          >
                            <Mail />
                          </Button>
                        ) : (
                          <Link
                            to={`/admin-panel/quizzes/${quiz.id}/invites`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`Invite students to ${quiz.title}`}
                            title="Invite students"
                          >
                            <Mail />
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditForm(quiz)}
                          aria-label={`Edit ${quiz.title}`}
                          title="Edit quiz"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(quiz.id)}
                          aria-label={`Delete ${quiz.title}`}
                          title="Delete quiz"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  )
}
