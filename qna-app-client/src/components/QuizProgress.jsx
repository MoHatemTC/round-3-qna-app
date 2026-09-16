import { cn } from "@/lib/utils";

// Answered-questions progress for the quiz page: a green bar plus numbered
// chips that turn green once answered and jump to their question on click.
// `currentIds` = questions on the page being shown. Only those chips are
// clickable (they scroll to the question); other pages are locked because the
// quiz only moves forward.
export default function QuizProgress({ questions, answers, currentIds, onJump }) {
  const total = questions.length;
  const answered = questions.filter((question) => answers[question.id] !== undefined).length;
  const percent = total ? Math.round((answered / total) * 100) : 0;
  const complete = total > 0 && answered === total;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {complete ? "All questions answered" : `${answered} of ${total} answered`}
        </span>
        <span className="font-semibold text-green-700 dark:text-green-400">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-valuetext={`${answered} of ${total} questions answered`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-green-500 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <nav aria-label="Jump to question" className="flex flex-wrap gap-1.5 pt-1">
        {questions.map((question, index) => {
          const isAnswered = answers[question.id] !== undefined;
          const isCurrent = currentIds?.has(question.id) ?? false;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onJump(question.id)}
              disabled={!isCurrent}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Question ${index + 1}, ${isAnswered ? "answered" : "not answered"}${isCurrent ? ", on this page" : ""}`}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-default",
                isAnswered
                  ? "bg-green-500 text-white enabled:hover:bg-green-600"
                  : "bg-gray-100 text-gray-600 ring-1 ring-gray-200 enabled:hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
                // Questions on the current page: dark outline with a gap, visible on green or grey.
                isCurrent && "ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-gray-900",
                !isCurrent && "opacity-60"
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
