import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_STYLES,
  QUESTION_TYPE_LABELS,
} from "@/lib/questionBank"

// Read-only pieces of a question card, shared by the Question Bank page, the
// bank picker and a quiz's question list.

const chip = "rounded-full px-2 py-0.5 text-xs font-medium"

export function QuestionMeta({ question, className }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className={cn(chip, "bg-muted text-muted-foreground")}>
        {QUESTION_TYPE_LABELS[question.type] ?? question.type}
      </span>
      {question.difficulty && (
        <span className={cn(chip, DIFFICULTY_STYLES[question.difficulty])}>
          {DIFFICULTY_LABELS[question.difficulty]}
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {question.points} {question.points === 1 ? "point" : "points"}
      </span>
      {question.category && (
        <span className={cn(chip, "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300")}>
          {question.category}
        </span>
      )}
      {(question.tags ?? []).map((tag) => (
        <span key={tag} className={cn(chip, "ring-1 ring-border text-muted-foreground")}>
          #{tag}
        </span>
      ))}
    </div>
  )
}

export function QuestionOptions({ options }) {
  return (
    <ul className="space-y-1">
      {options.map((option) => (
        <li key={option.id} className="flex items-center gap-2 text-sm text-muted-foreground">
          {option.is_correct ? (
            <Check className="size-3.5 shrink-0 text-green-600" aria-label="Correct answer" />
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          <span className={option.is_correct ? "font-medium text-foreground" : undefined}>
            {option.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function QuestionUsage({ question }) {
  const quizzes = question.quizzes ?? []
  if (quizzes.length === 0) {
    return <p className="text-xs text-muted-foreground">Not used in any quiz yet</p>
  }
  return (
    <p className="text-xs text-muted-foreground">
      Used in {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}:{" "}
      {quizzes.map(({ quiz }, index) => (
        <span key={quiz.id}>
          {index > 0 && ", "}
          <span className="font-medium text-foreground">{quiz.title}</span>
          {quiz.status === "draft" && " (draft)"}
        </span>
      ))}
    </p>
  )
}
