import { useState } from "react"
import { CircleCheck, Library, Pencil, Plus, Trash2 } from "lucide-react"
import { createBankQuestion, deleteBankQuestion, updateBankQuestion } from "@/services/services"
import { isQuizLive } from "@/lib/quizStatus"
import { activeUsages, emptyBankFilters, hasActiveFilters, toFormState } from "@/lib/questionBank"
import { useQuestionBankFacets, useQuestionBankSearch } from "@/hooks/useQuestionBankSearch"
import { Button } from "@/components/ui/button"
import { AdminPageHeader, adminPrimaryButton } from "@/components/admin/AdminLayout"
import QuestionForm from "@/components/admin/QuestionForm"
import QuestionBankFilters from "@/components/admin/QuestionBankFilters"
import Pagination from "@/components/admin/Pagination"
import { QuestionMeta, QuestionOptions, QuestionUsage } from "@/components/admin/QuestionSummary"

// Admin: every reusable question, whether it was written here or while
// building a quiz. Nested under /admin-panel/question-bank.

const PAGE_SIZE = 20

function editNotice(question) {
  const count = question.quizzes?.length ?? 0
  if (count === 0) return null
  return `This question is used in ${count} ${count === 1 ? "quiz" : "quizzes"}. Your changes will show up in all of them.`
}

function BankQuestionCard({ question, onEdit, onDelete, deleting }) {
  return (
    <div className="space-y-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <QuestionMeta question={question} />
          <p className="text-sm font-medium text-foreground">{question.text}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit question">
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete question"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <QuestionOptions options={question.options} />

      {question.explanation && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Explanation: </span>
          {question.explanation}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <QuestionUsage question={question} />
        <span className="text-xs text-muted-foreground">
          Added {new Date(question.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </span>
      </div>
    </div>
  )
}

export default function AdminQuestionBank() {
  const [filters, setFilters] = useState(emptyBankFilters)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [pageError, setPageError] = useState("")
  const [notice, setNotice] = useState("")

  const facets = useQuestionBankFacets()
  const bank = useQuestionBankSearch(filters, { page, pageSize: PAGE_SIZE })

  function changeFilters(next) {
    setFilters(next)
    setPage(1)
  }

  function refresh() {
    bank.reload()
    facets.reload()
  }

  function afterDelete() {
    setNotice("Question deleted from the bank.")
    // Don't strand the admin on a page that just became empty.
    if (bank.items.length === 1 && page > 1) setPage(page - 1)
    refresh()
  }

  async function handleCreate(payload, setFormError) {
    setSaving(true)
    try {
      await createBankQuestion(payload)
      setShowCreate(false)
      setNotice("Question added to the bank.")
      setPageError("")
      // Newest first, so the new question is at the top of page 1.
      setPage(1)
      refresh()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(questionId, payload, setFormError) {
    setSaving(true)
    try {
      await updateBankQuestion(questionId, payload)
      setEditingId(null)
      setNotice("Question updated.")
      refresh()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(question) {
    const inUse = activeUsages(question)
    const prompt = inUse.length
      ? `This question is in ${inUse.length} published ${inUse.length === 1 ? "quiz" : "quizzes"}. Deleting it removes it from ${inUse.length === 1 ? "that quiz" : "those quizzes"} too. Continue?`
      : "Delete this question from the bank? Quizzes that already ended keep it for their results."
    if (!window.confirm(prompt)) return

    setDeletingId(question.id)
    setPageError("")
    try {
      await deleteBankQuestion(question.id, { force: inUse.length > 0 })
      afterDelete()
    } catch (err) {
      // The bank changed since this page loaded (e.g. a quiz was published).
      const quizzes = err.body?.quizzes ?? []
      const live = quizzes.some((quiz) => isQuizLive(quiz))
      if (err.status === 409 && !live && quizzes.length) {
        if (window.confirm(`${err.message}\n\nDelete it anyway?`)) {
          try {
            await deleteBankQuestion(question.id, { force: true })
            afterDelete()
          } catch (retryErr) {
            setPageError(retryErr.message)
          }
        }
      } else {
        setPageError(err.message)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = hasActiveFilters(filters)

  return (
    <>
      <AdminPageHeader
        eyebrow="Question bank"
        title="Question bank"
        description="Every question you've written, ready to reuse in any quiz. Questions created inside a quiz land here too."
        actions={
          !showCreate && (
            <button
              type="button"
              className={adminPrimaryButton}
              onClick={() => {
                setEditingId(null)
                setNotice("")
                setShowCreate(true)
              }}
            >
              <Plus /> New question
            </button>
          )
        }
      />

      {notice && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-200 dark:ring-green-500/30"
        >
          <CircleCheck className="size-4 text-green-600" /> {notice}
        </p>
      )}

      {pageError && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </p>
      )}

      {showCreate && (
        <div className="mb-6">
          <QuestionForm
            title="New question"
            submitLabel="Add to bank"
            saving={saving}
            categories={facets.categories}
            onCancel={() => setShowCreate(false)}
            onSubmit={handleCreate}
          />
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
        <QuestionBankFilters
          filters={filters}
          onChange={changeFilters}
          categories={facets.categories}
          tags={facets.tags}
        />
      </div>

      {bank.error && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bank.error}
        </p>
      )}

      {!bank.error && (
        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
          {bank.loading && bank.items.length === 0
            ? "Loading questions..."
            : `${bank.total} ${bank.total === 1 ? "question" : "questions"}${filtered ? " match" : " in the bank"}`}
        </p>
      )}

      <div className={`space-y-3 ${bank.loading ? "opacity-60" : ""}`}>
        {!bank.loading && !bank.error && bank.items.length === 0 && (
          filtered ? (
            <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
              No questions match these filters.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground transition-colors hover:border-orange-400 hover:text-foreground"
            >
              <Library className="size-5 text-orange-600" />
              <span className="font-semibold">The question bank is empty</span>
              <span className="text-sm">Add a question here, or create one while building a quiz.</span>
            </button>
          )
        )}

        {bank.items.map((question) =>
          editingId === question.id ? (
            <QuestionForm
              key={question.id}
              title="Edit question"
              initial={toFormState(question)}
              notice={editNotice(question)}
              saving={saving}
              categories={facets.categories}
              onCancel={() => setEditingId(null)}
              onSubmit={(payload, setFormError) => handleUpdate(question.id, payload, setFormError)}
            />
          ) : (
            <BankQuestionCard
              key={question.id}
              question={question}
              deleting={deletingId === question.id}
              onEdit={() => {
                setShowCreate(false)
                setNotice("")
                setEditingId(question.id)
              }}
              onDelete={() => handleDelete(question)}
            />
          )
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} pageSize={PAGE_SIZE} total={bank.total} onPageChange={setPage} />
      </div>
    </>
  )
}
