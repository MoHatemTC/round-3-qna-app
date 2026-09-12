import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAttemptResult, submitAttempt } from "@/services/services";

function getBooleanValue(option) {
  const value = String(option?.value ?? option?.text ?? option).toLowerCase();
  return value === "true";
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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
  const submittedRef = useRef(false);

  const attemptId = state?.attemptId;
  const questions = state?.questions ?? [];
  const isExpired = remainingSeconds <= 0;

  useEffect(() => {
    if (!state?.endTime || submittedRef.current) return undefined;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((new Date(state.endTime).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
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

    if (payload.length === 0) {
      setError("Select at least one answer before submitting.");
      return;
    }

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

  const submitWhenExpired = useEffectEvent(handleSubmit);

  useEffect(() => {
    if (isExpired && !submittedRef.current && payload.length) submitWhenExpired();
  }, [isExpired, payload.length]);

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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className={`sticky top-4 z-10 flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm ${remainingSeconds < 60 ? "border-red-300 text-red-700" : ""}`}>
          <span className="flex items-center gap-2 text-sm font-medium"><Clock3 className="size-4" />Time remaining</span>
          <strong aria-live="polite" className="font-mono text-lg">{formatTime(remainingSeconds)}</strong>
        </div>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {i + 1}. {q.text}
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

        <Button
          onClick={handleSubmit}
          disabled={submitting || isExpired}
          className="w-full"
          size="lg"
        >
          {submitting ? "Submitting..." : isExpired ? "Time expired" : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}