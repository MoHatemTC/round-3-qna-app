import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ChevronRight, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuizProgress from "@/components/QuizProgress";
import { getAttemptResult, submitAttempt } from "@/services/services";

function getBooleanValue(option) {
  const value = String(option?.value ?? option?.text ?? option).toLowerCase();
  return value === "true";
}

// Questions are shown in pages of this size; students can only move forward.
const QUESTIONS_PER_PAGE = 5;

function formatTime(seconds) {
  const pad = (n) => String(n).padStart(2, "0");
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = `${pad(minutes)}:${pad(seconds % 60)}`;
  return hours ? `${hours}:${rest}` : rest;
}

export default function QuizSolve() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const end = state?.endTime ? new Date(state.endTime).getTime() : 0;
    return end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : 0;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const submittedRef = useRef(false);
  const pageHeadingRef = useRef(null);

  const attemptId = state?.attemptId;
  const questions = state?.questions ?? [];
  const isExpired = remainingSeconds <= 0;

  // Countdown tick — recomputed from the server's end time every second.
  useEffect(() => {
    if (!state?.endTime || submittedRef.current) return undefined;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((new Date(state.endTime).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state?.endTime]);

  // Page Visibility API — recompute remaining time the moment the tab becomes
  // visible again, so a throttled/backgrounded interval doesn't delay
  // detecting that the deadline already passed.
  useEffect(() => {
    if (!state?.endTime || submittedRef.current) return undefined;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const seconds = Math.max(0, Math.ceil((new Date(state.endTime).getTime() - Date.now()) / 1000));
        setRemainingSeconds(seconds);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state?.endTime]);

  const payload = questions.flatMap((question) => {
    const selected = answers[question.id];
    if (selected === undefined) return [];
    return [question.type === "true_false"
      ? { question_id: question.id, boolean_answer: selected }
      : { question_id: question.id, selected_option_id: selected }];
  });

  const handleSubmit = async () => {
    if (submitting || submittedRef.current || !attemptId) return;

    setSubmitting(true);
    setError("");
    try {
      const result = await submitAttempt(attemptId, payload);
      submittedRef.current = true;
      navigate(`/quiz/${id}/result`, { state: { attemptId, result } });
    } catch (err) {
      if (err.status === 409) {
        try {
          const result = await getAttemptResult(attemptId);
          submittedRef.current = true;
          navigate(`/quiz/${id}/result`, { state: { attemptId, result } });
          return;
        } catch (resultError) {
          setError(resultError.message || "This attempt was already submitted.");
        }
      } else if (err.status === 400 && /expired/i.test(err.message)) {
        setError("This attempt has expired. Your answers could not be submitted.");
      } else {
        setError(err.message || "Submission failed. Try again.");
      }
      setSubmitting(false);
    }
  };

  // After moving to the next page, put focus on its heading so keyboard and
  // screen reader users follow along. Skipped on first render.
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }
    pageHeadingRef.current?.focus({ preventScroll: true });
  }, [currentPage]);

  const submitWhenExpired = useEffectEvent(handleSubmit);

  // Auto-submit at zero — fires regardless of whether anything was answered,
  // so blank attempts are still recorded rather than silently dropped.
  useEffect(() => {
    if (isExpired && !submittedRef.current) submitWhenExpired();
  }, [isExpired]);

  if (!attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        No active attempt found. Please start the quiz again from the instructions page.
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-muted-foreground">
        This quiz has no questions available yet. Please return to the dashboard and try again later.
      </div>
    );
  }

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const page = Math.min(currentPage, totalPages - 1);
  const pageStart = page * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);
  const pageQuestionIds = new Set(pageQuestions.map((question) => question.id));
  const isLastPage = page === totalPages - 1;
  const unansweredOnPage = pageQuestions.filter((question) => answers[question.id] === undefined).length;
  const isWarning = !isExpired && remainingSeconds <= 120;

  function goToNextPage() {
    if (isLastPage) return;
    setCurrentPage(page + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToQuestion(questionId) {
    document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className={`sticky top-4 z-10 space-y-3 rounded-lg border bg-white px-4 py-3 shadow-sm ${remainingSeconds < 60 ? "border-red-300" : ""}`}>
          <div className={`flex items-center justify-between ${remainingSeconds < 60 ? "text-red-700" : ""}`}>
            <span className="flex items-center gap-2 text-sm font-medium"><Clock3 className="size-4" />Time remaining</span>
            <strong aria-live="polite" className="font-mono text-lg">{formatTime(remainingSeconds)}</strong>
          </div>
          <QuizProgress
            questions={questions}
            answers={answers}
            currentIds={pageQuestionIds}
            onJump={scrollToQuestion}
          />
        </div>

        {isWarning && (
          <div role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Less than 2 minutes remaining — your answers will auto-submit at zero.
          </div>
        )}

        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <h2
          ref={pageHeadingRef}
          tabIndex={-1}
          className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground outline-none"
        >
          {totalPages > 1 && `Page ${page + 1} of ${totalPages} · `}
          Questions {pageStart + 1}–{pageStart + pageQuestions.length} of {questions.length}
        </h2>

        {pageQuestions.map((q, i) => (
          <Card key={q.id} id={`question-${q.id}`} className="scroll-mt-56">
            <CardHeader>
              <CardTitle className="text-base">
                {pageStart + i + 1}. {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(q.options ?? []).map((opt) => {
                const optionKey = opt.id ?? opt;
                const value = q.type === "true_false" ? getBooleanValue(opt) : optionKey;
                const selected = answers[q.id] === value;
                return (
                  <button
                    key={optionKey}
                    type="button"
                    aria-pressed={selected}
                    disabled={submitting || isExpired}
                    onClick={() => setAnswers((previous) => ({ ...previous, [q.id]: value }))}
                    className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    {opt.text ?? opt}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {unansweredOnPage > 0 && !isExpired && (
          <p className="text-center text-sm text-amber-700">
            {unansweredOnPage} {unansweredOnPage === 1 ? "question" : "questions"} on this page{" "}
            {unansweredOnPage === 1 ? "is" : "are"} unanswered.{" "}
            {isLastPage ? "You can still submit." : "You won't be able to come back to this page."}
          </p>
        )}

        {isLastPage ? (
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || isExpired}
            className="w-full bg-green-600 text-white hover:bg-green-700"
          >
            {submitting ? "Submitting..." : isExpired ? "Time expired" : "Submit quiz"}
          </Button>
        ) : (
          <Button size="lg" onClick={goToNextPage} disabled={submitting || isExpired} className="w-full">
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}