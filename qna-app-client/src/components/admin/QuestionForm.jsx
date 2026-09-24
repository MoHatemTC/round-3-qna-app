import { useState } from "react"
import { Info, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DIFFICULTY_LABELS } from "@/lib/questionBank"

// The one question editor, used on the Question Bank page and inside a quiz.
// Either way the result is a bank question; inside a quiz it is also added to
// that quiz.

const fieldClass =
  "w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"

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
  return {
    type: "mcq",
    text: "",
    points: "1",
    options: emptyOptionsFor("mcq"),
    difficulty: "medium",
    category: "",
    tags: "",
    explanation: "",
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

function toPayload(form) {
  return {
    type: form.type,
    text: form.text,
    points: Number(form.points),
    options: form.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
    difficulty: form.difficulty,
    category: form.category.trim() || undefined,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    explanation: form.explanation.trim() || undefined,
  }
}

export default function QuestionForm({
  initial,
  onCancel,
  onSubmit,
  saving,
  title,
  notice,
  submitLabel = "Save question",
  categories = [],
}) {
  const [form, setForm] = useState(initial ?? emptyQuestionForm())
  const [error, setError] = useState("")
  const idPrefix = title.replace(/\W+/g, "-").toLowerCase()

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

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
    onSubmit(toPayload(form), setError)
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

      {notice && (
        <p className="flex gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/30">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <span>{notice}</span>
        </p>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-text`}>
            Question text
          </label>
          <textarea
            id={`${idPrefix}-text`}
            rows={2}
            required
            value={form.text}
            onChange={(e) => setField("text", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-points`}>
            Points
          </label>
          <input
            id={`${idPrefix}-points`}
            type="number"
            min={1}
            required
            value={form.points}
            onChange={(e) => setField("points", e.target.value)}
            className={`${fieldClass} w-24`}
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
                name={`${idPrefix}-correct-option`}
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
                className={`${fieldClass} read-only:bg-muted`}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-difficulty`}>
            Difficulty
          </label>
          <select
            id={`${idPrefix}-difficulty`}
            value={form.difficulty}
            onChange={(e) => setField("difficulty", e.target.value)}
            className={fieldClass}
          >
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-category`}>
            Category <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-category`}
            list={`${idPrefix}-categories`}
            value={form.category}
            maxLength={100}
            placeholder="e.g. JavaScript"
            onChange={(e) => setField("category", e.target.value)}
            className={fieldClass}
          />
          <datalist id={`${idPrefix}-categories`}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-tags`}>
            Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
          </label>
          <input
            id={`${idPrefix}-tags`}
            value={form.tags}
            placeholder="e.g. closures, async"
            onChange={(e) => setField("tags", e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor={`${idPrefix}-explanation`}>
          Explanation <span className="font-normal text-muted-foreground">(optional, admins only)</span>
        </label>
        <textarea
          id={`${idPrefix}-explanation`}
          rows={2}
          maxLength={2000}
          value={form.explanation}
          onChange={(e) => setField("explanation", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
