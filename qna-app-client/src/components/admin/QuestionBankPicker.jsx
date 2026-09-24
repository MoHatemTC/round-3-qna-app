import { useEffect, useRef, useState } from "react"
import { Library, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { emptyBankFilters, hasActiveFilters } from "@/lib/questionBank"
import { useQuestionBankFacets, useQuestionBankSearch } from "@/hooks/useQuestionBankSearch"
import QuestionBankFilters from "@/components/admin/QuestionBankFilters"
import Pagination from "@/components/admin/Pagination"
import { QuestionMeta, QuestionOptions } from "@/components/admin/QuestionSummary"

const PAGE_SIZE = 10

// "Select from question bank": a searchable, filterable list of bank questions
// not yet in this quiz. The selection survives paging and filtering, and is
// added in the order it was picked.
export default function QuestionBankPicker({ quizId, onClose, onAdd }) {
  const [filters, setFilters] = useState(emptyBankFilters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const facets = useQuestionBankFacets()
  const { items, total, loading, error } = useQuestionBankSearch(filters, {
    page,
    pageSize: PAGE_SIZE,
    excludeQuizId: quizId,
  })
  const dialogRef = useRef(null)
  // Kept in a ref so the mount effect below runs once; re-running it would
  // pull focus out of the search box on every keystroke.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e) {
      if (e.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  function changeFilters(next) {
    setFilters(next)
    setPage(1)
  }

  function toggle(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  async function handleAdd() {
    setAdding(true)
    setAddError("")
    try {
      await onAdd(selected)
    } catch (err) {
      setAddError(err.message)
      setAdding(false)
    }
  }

  const pageIds = items.map((question) => question.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  function togglePage() {
    setSelected((current) =>
      allOnPageSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...current, ...pageIds.filter((id) => !current.includes(id))]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-picker-title"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-background shadow-xl ring-1 ring-foreground/10 outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 id="bank-picker-title" className="flex items-center gap-2 text-lg font-bold">
              <Library className="size-5 text-orange-600" /> Select from question bank
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Questions already in this quiz are hidden. Selected questions are added to the end.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-border p-5">
          <QuestionBankFilters
            filters={filters}
            onChange={changeFilters}
            categories={facets.categories}
            tags={facets.tags}
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!error && items.length > 0 && (
            <label className="flex items-center gap-2 pb-1 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={togglePage}
                aria-label="Select all on this page"
                className="size-4 accent-orange-600"
              />
              Select all on this page
            </label>
          )}

          {loading && items.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Loading questions...</p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              {hasActiveFilters(filters)
                ? "No questions match these filters."
                : "No more questions in the bank to add. Create a new question instead."}
            </p>
          )}

          <div className={loading ? "opacity-60" : undefined}>
            {items.map((question) => {
              const checked = selected.includes(question.id)
              return (
                <label
                  key={question.id}
                  className={`mb-2 flex cursor-pointer gap-3 rounded-xl p-4 ring-1 transition-colors ${
                    checked
                      ? "bg-orange-50 ring-orange-300 dark:bg-orange-500/10 dark:ring-orange-500/40"
                      : "bg-card ring-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(question.id)}
                    className="mt-1 size-4 shrink-0 accent-orange-600"
                    aria-label={`Select: ${question.text}`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <QuestionMeta question={question} />
                    <p className="text-sm font-medium text-foreground">{question.text}</p>
                    <QuestionOptions options={question.options} />
                  </div>
                </label>
              )
            })}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {addError ? (
              <p role="alert" className="text-destructive">{addError}</p>
            ) : (
              <p className="text-muted-foreground">
                {selected.length} {selected.length === 1 ? "question" : "questions"} selected
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="ml-2 font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selected.length === 0 || adding}>
              {adding
                ? "Adding..."
                : selected.length
                  ? `Add ${selected.length} ${selected.length === 1 ? "question" : "questions"} to quiz`
                  : "Add to quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
