import { cn } from "@/lib/utils"
import { getQuizActivation } from "@/lib/quizStatus"
import { useNow } from "@/hooks/useNow"

// Green = active, red = inactive. The reason line explains the state in words
// so colour is never the only signal. Re-checks the clock every 30s so the
// badge flips on its own when the quiz window opens or closes.
export default function QuizStatusBadge({ quiz, showReason = true, className }) {
  const now = useNow()
  const { active, label, reason } = getQuizActivation(quiz, now)

  return (
    <div className={cn("min-w-0", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
          active
            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full", active ? "bg-green-500" : "bg-red-500")}
        />
        {label}
      </span>
      {showReason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}
    </div>
  )
}
