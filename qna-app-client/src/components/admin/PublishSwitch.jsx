import { cn } from "@/lib/utils"
import { hasEnded, questionCount } from "@/lib/quizStatus"
import { useNow } from "@/hooks/useNow"

// Publish/unpublish toggle. Publishing is blocked until the quiz has a question
// and while its end time is in the past.
export default function PublishSwitch({ quiz, busy, onToggle }) {
  const now = useNow()
  const published = quiz.status === "published"
  const noQuestions = questionCount(quiz) === 0
  const ended = hasEnded(quiz, now)
  const blocked = !published && (noQuestions || ended)

  const hint = !published && noQuestions
    ? "Add at least one question to publish"
    : !published && ended
      ? "The end time has passed — edit the quiz and set a later end time to publish"
      : published
        ? "Published — click to move back to draft"
        : "Draft — click to publish"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={`Publish ${quiz.title}`}
      title={hint}
      disabled={blocked || busy}
      onClick={() => onToggle(quiz)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        published ? "bg-green-500" : "bg-foreground/20"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform",
          published && "translate-x-4"
        )}
      />
    </button>
  )
}
