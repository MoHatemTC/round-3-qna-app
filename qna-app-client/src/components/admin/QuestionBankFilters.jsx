import { Search, X } from "lucide-react"
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  emptyBankFilters,
  hasActiveFilters,
} from "@/lib/questionBank"

// Search box plus type / difficulty / category / tag / created-date filters.
// Controlled: the parent owns the filters object.

const control =
  "rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"

export default function QuestionBankFilters({ filters, onChange, categories = [], tags = [] }) {
  function set(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search question text..."
          aria-label="Search questions"
          className={`${control} w-full pl-9`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.type}
          onChange={(e) => set("type", e.target.value)}
          aria-label="Filter by type"
          className={control}
        >
          <option value="">All types</option>
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.difficulty}
          onChange={(e) => set("difficulty", e.target.value)}
          aria-label="Filter by difficulty"
          className={control}
        >
          <option value="">Any difficulty</option>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          aria-label="Filter by category"
          className={control}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={filters.tag}
          onChange={(e) => set("tag", e.target.value)}
          aria-label="Filter by tag"
          className={control}
        >
          <option value="">Any tag</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          From
          <input
            type="date"
            value={filters.created_from}
            max={filters.created_to || undefined}
            onChange={(e) => set("created_from", e.target.value)}
            aria-label="Created from"
            className={control}
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          To
          <input
            type="date"
            value={filters.created_to}
            min={filters.created_from || undefined}
            onChange={(e) => set("created_to", e.target.value)}
            aria-label="Created to"
            className={control}
          />
        </label>

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(emptyBankFilters)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
