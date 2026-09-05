import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Pencil, Trash2, Plus, X, LogOut } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

// Admin: Quizzes & Question Bank
// Quiz list + create/edit form for /admin/quizzes. Requires an admin session
// cookie (see src/pages/Login.jsx) - a student session gets a 403 from the API.

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

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function AdminQuizzes() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  // Fail-safe: assume not signed in as admin until loadQuizzes proves otherwise.
  const [needsSignIn, setNeedsSignIn] = useState(true)
  const [showSignInLink, setShowSignInLink] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadQuizzes() {
    try {
      const data = await api.get("/admin/quizzes")
      setQuizzes(data)
      setPageError("")
      setNeedsSignIn(false)
      setShowSignInLink(false)
    } catch (err) {
      // Any failure (including a network error) keeps New quiz/Edit/Delete
      // disabled - admin access is only confirmed by a successful load.
      setNeedsSignIn(true)
      // Only an actual auth failure gets the "Sign in" link - a 500 or
      // network error doesn't mean the user is logged out.
      setShowSignInLink(err.status === 401 || err.status === 403)
      setPageError(
        err.status === 403
          ? "You're signed in, but this account isn't an admin."
          : err.status === 401
            ? "Please sign in as an admin to manage quizzes."
            : err.message
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
    if (needsSignIn) return
    setEditingId(null)
    setForm(emptyForm)
    setFormError("")
    setShowForm(true)
  }

  function openEditForm(quiz) {
    if (needsSignIn) return
    setEditingId(quiz.id)
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
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
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
      status: form.status,
    }

    try {
      if (editingId) {
        await api.put(`/admin/quizzes/${editingId}`, payload)
      } else {
        await api.post("/admin/quizzes", payload)
      }
      closeForm()
      await loadQuizzes()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (needsSignIn) return
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return
    try {
      await api.delete(`/admin/quizzes/${id}`)
      await loadQuizzes()
    } catch (err) {
      setPageError(err.message)
    }
  }

  async function handleSignOut() {
    try {
      await api.post("/auth/logout", {})
    } catch {
      // Ignore - we're navigating to /login either way.
    } finally {
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit and remove quizzes for the question bank.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openCreateForm}
            disabled={needsSignIn}
            title={needsSignIn ? "Sign in as an admin to create a quiz" : undefined}
          >
            <Plus /> New quiz
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>

      {pageError && (
        <p className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{pageError}</span>
          {showSignInLink && (
            <Link to="/login" className="shrink-0 font-medium underline underline-offset-2">
              Sign in
            </Link>
          )}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit quiz" : "New quiz"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close form"
            >
              <X className="size-4" />
            </button>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="duration">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                required
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="starts_at">
                Starts at
              </label>
              <input
                id="starts_at"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="ends_at">
                Ends at
              </label>
              <input
                id="ends_at"
                type="datetime-local"
                required
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create quiz"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Duration</th>
              <th className="px-4 py-2 font-medium">Starts</th>
              <th className="px-4 py-2 font-medium">Ends</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading quizzes...
                </td>
              </tr>
            )}

            {!loading && quizzes.length === 0 && !pageError && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No quizzes yet. Create one to get started.
                </td>
              </tr>
            )}

            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-foreground">{quiz.title}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      quiz.status === "published"
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {quiz.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-foreground">{quiz.duration_minutes} min</td>
                <td className="px-4 py-2 text-foreground">{formatDate(quiz.starts_at)}</td>
                <td className="px-4 py-2 text-foreground">{formatDate(quiz.ends_at)}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditForm(quiz)}
                      aria-label={`Edit ${quiz.title}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(quiz.id)}
                      aria-label={`Delete ${quiz.title}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
