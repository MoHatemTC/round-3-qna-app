import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  CircleCheck,
  Library,
  Lock,
  Pencil,
  Plus,
  X,
} from "lucide-react"
import {
  attachBankQuestions,
  createQuizQuestion,
  getQuiz,
  getQuizQuestions,
  publishQuiz,
  removeQuizQuestion,
  reorderQuizQuestions,
  unpublishQuiz,
  updateQuizQuestion,
} from "@/services/services"
import { formatDateTime, isQuizLive } from "@/lib/quizStatus"
import { toFormState } from "@/lib/questionBank"
import { useNow } from "@/hooks/useNow"
import { useQuestionBankFacets } from "@/hooks/useQuestionBankSearch"
import { Button } from "@/components/ui/button"
import QuizStatusBadge from "@/components/admin/QuizStatusBadge"
import PublishSwitch from "@/components/admin/PublishSwitch"
import QuestionForm from "@/components/admin/QuestionForm"
import QuestionBankPicker from "@/components/admin/QuestionBankPicker"
import { QuestionMeta, QuestionOptions } from "@/components/admin/QuestionSummary"
import {
  AdminCard,
  AdminPageHeader,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin/AdminLayout"

// Admin: Questions for a single quiz. Nested under /admin-panel/quizzes/:quizId/questions
// (see src/utils/proxy.jsx for why admin routes must live under /admin-panel).
// Requires an admin session cookie, same as AdminQuizzes.jsx.
//
// A quiz's questions are question-bank questions. Adding one here either picks
// it from the bank or creates it (which also saves it to the bank). Removing
// one only takes it out of this quiz; editing one edits the bank copy.

function sharedWith(question, quizId) {
  return (question.quizzes ?? []).filter(({ quiz }) => quiz.id !== quizId)
}

function editNotice(question, quizId) {
  const others = sharedWith(question, quizId)
  if (others.length === 0) return null
  return `This question is also used in ${others.map(({ quiz }) => `"${quiz.title}"`).join(", ")}. Your changes will show up there too.`
}

function QuestionRow({
  number,
  question,
  quizId,
  locked,
  busy,
  isFirst,
  isLast,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const others = sharedWith(question, quizId)
  const lockedTitle = locked ? "Locked while the quiz is live" : undefined

  return (
    <div className="space-y-2 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
              {number}
            </span>
            <QuestionMeta question={question} />
          </div>
          <p className="text-sm text-foreground">{question.text}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            disabled={locked || busy || isFirst}
            title={lockedTitle}
            aria-label={`Move question ${number} up`}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            disabled={locked || busy || isLast}
            title={lockedTitle}
            aria-label={`Move question ${number} down`}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            disabled={locked}
            title={lockedTitle}
            aria-label={`Edit question ${number}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={locked || busy}
            title={locked ? lockedTitle : "Remove from this quiz (stays in the question bank)"}
            aria-label={`Remove question ${number} from this quiz`}
          >
            <X />
          </Button>
        </div>
      </div>

      <QuestionOptions options={question.options} />

      {others.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Library className="size-3.5" />
          Also used in {others.length} other {others.length === 1 ? "quiz" : "quizzes"}
        </p>
      )}
    </div>
  )
}

function AddQuestionChoices({ onPickFromBank, onCreate }) {
  const choice =
    "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-border p-6 text-center text-muted-foreground transition-colors hover:border-orange-400 hover:text-foreground"
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={onPickFromBank} className={choice}>
        <Library className="size-5 text-orange-600" />
        <span className="font-semibold text-foreground">Select from question bank</span>
        <span className="text-sm">Reuse questions you've already written</span>
      </button>
      <button type="button" onClick={onCreate} className={choice}>
        <Plus className="size-5 text-orange-600" />
        <span className="font-semibold text-foreground">Create new question</span>
        <span className="text-sm">It's also saved to the bank for reuse</span>
      </button>
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
  const [notice, setNotice] = useState("")

  const [showAddForm, setShowAddForm] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const now = useNow()
  const facets = useQuestionBankFacets()

  async function load() {
    try {
      const [quizData, questionsData] = await Promise.all([
        getQuiz(quizId),
        getQuizQuestions(quizId),
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

  function openCreateForm() {
    setEditingId(null)
    setNotice("")
    setShowAddForm(true)
  }

  function openPicker() {
    setNotice("")
    setShowPicker(true)
  }

  async function handleCreate(payload, setFormError) {
    setSaving(true)
    try {
      await createQuizQuestion(quizId, payload)
      setShowAddForm(false)
      setNotice("Question added to this quiz and saved to the question bank.")
      await load()
      facets.reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Throws on failure so the picker can show the error and stay open.
  async function handleAttach(questionIds) {
    const result = await attachBankQuestions(quizId, questionIds)
    setQuestions(result.questions)
    setShowPicker(false)
    setNotice(
      `Added ${result.added} ${result.added === 1 ? "question" : "questions"} from the bank.` +
        (result.skipped ? ` ${result.skipped} already in this quiz.` : "")
    )
  }

  async function handleUpdate(questionId, payload, setFormError) {
    setSaving(true)
    try {
      await updateQuizQuestion(quizId, questionId, payload)
      setEditingId(null)
      setNotice("Question updated in the bank.")
      await load()
      facets.reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(questionId) {
    const confirmed = window.confirm(
      "Remove this question from the quiz? It stays in the question bank, so you can add it back later."
    )
    if (!confirmed) return
    try {
      await removeQuizQuestion(quizId, questionId)
      setNotice("Question removed from this quiz. It's still in the question bank.")
      await load()
    } catch (err) {
      setPageError(err.message)
    }
  }

  async function handleMove(index, direction) {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const previous = questions
    const reordered = [...questions]
    reordered[index] = questions[target]
    reordered[target] = questions[index]
    // Move right away; put it back if the server refuses.
    setQuestions(reordered)
    setReordering(true)
    setPageError("")
    try {
      const saved = await reorderQuizQuestions(
        quizId,
        reordered.map((question) => question.id)
      )
      setQuestions(saved)
    } catch (err) {
      setQuestions(previous)
      setPageError(err.message)
    } finally {
      setReordering(false)
    }
  }

  async function handleTogglePublish() {
    setPublishing(true)
    setPageError("")
    try {
      if (quiz.status === "published") await unpublishQuiz(quiz.id)
      else await publishQuiz(quiz.id)
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
  const canAdd = Boolean(quiz) && !locked && !showAddForm

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
        description="Add questions from the question bank or create new ones, then put them in order."
        actions={
          canAdd &&
          questions.length > 0 && (
            <>
              <button type="button" className={adminSecondaryButton} onClick={openPicker}>
                <Library /> Select from bank
              </button>
              <button type="button" className={adminPrimaryButton} onClick={openCreateForm}>
                <Plus /> Create new question
              </button>
            </>
          )
        }
      />

      {notice && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-200 dark:ring-green-500/30"
        >
          <CircleCheck className="size-4 shrink-0 text-green-600" /> {notice}
        </p>
      )}

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
              {justCreated ? "Quiz created — now add its questions" : "This quiz has no questions yet"}
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
            submitLabel="Add to quiz"
            notice="This question will also be saved to the question bank so you can reuse it in other quizzes."
            saving={saving}
            categories={facets.categories}
            onCancel={() => setShowAddForm(false)}
            onSubmit={handleCreate}
          />
        </div>
      )}

      <div className="space-y-3">
        {loading && <p className="text-center text-muted-foreground">Loading questions...</p>}

        {!loading && canAdd && questions.length === 0 && (
          <AddQuestionChoices onPickFromBank={openPicker} onCreate={openCreateForm} />
        )}

        {questions.map((question, index) =>
          editingId === question.id ? (
            <QuestionForm
              key={question.id}
              title="Edit question"
              initial={toFormState(question)}
              notice={editNotice(question, quizId)}
              saving={saving}
              categories={facets.categories}
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
              quizId={quizId}
              locked={locked}
              busy={reordering}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              onEdit={() => {
                setShowAddForm(false)
                setNotice("")
                setEditingId(question.id)
              }}
              onRemove={() => handleRemove(question.id)}
              onMoveUp={() => handleMove(index, -1)}
              onMoveDown={() => handleMove(index, 1)}
            />
          )
        )}

        {!loading && canAdd && questions.length > 0 && (
          <div className="pt-3">
            <p className="mb-2 text-sm font-semibold text-foreground">Add more questions</p>
            <AddQuestionChoices onPickFromBank={openPicker} onCreate={openCreateForm} />
          </div>
        )}
      </div>

      {showPicker && (
        <QuestionBankPicker
          quizId={quizId}
          onClose={() => setShowPicker(false)}
          onAdd={handleAttach}
        />
      )}
    </>
  )
}
