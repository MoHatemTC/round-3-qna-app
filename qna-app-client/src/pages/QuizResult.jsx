import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CheckCircle2, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAttemptResult } from "@/services/services";

export default function QuizResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const attemptId = state?.attemptId;
  const [result, setResult] = useState(state?.result ?? null);
  const [loading, setLoading] = useState(!state?.result && Boolean(attemptId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (result || !attemptId) return;
    getAttemptResult(attemptId)
      .then(setResult)
      .catch((err) => setError(err.message || "Unable to load your result."))
      .finally(() => setLoading(false));
  }, [attemptId, result]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading your result...</div>;
  if (!result) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center"><p role="alert" className="text-red-600">{error || "No result was found."}</p><Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button></div>;

  const awaitingGrading = result.grading_status === "awaiting_grading" || result.score == null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <main className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-2 size-10 text-green-600" />
          <h1 className="text-2xl font-semibold">Quiz submitted</h1>
          {awaitingGrading ? <p className="mt-3 font-medium">Your submission is awaiting grading.</p> : <p className="mt-3 text-3xl font-bold">{result.score} / {result.max_score} <span className="text-lg font-normal text-muted-foreground">({Number(result.percentage ?? 0).toFixed(1)}%)</span></p>}
          <p className="mt-2 text-sm text-muted-foreground">Status: {result.status}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Answer breakdown</h2>
          {(result.answers ?? []).map((answer, index) => {
            const question = answer.question;
            const selected = answer.selected_option_id
              ? question?.options?.find((option) => option.id === answer.selected_option_id)?.text
              : answer.boolean_answer == null ? null : String(answer.boolean_answer);
            const correct = question?.options?.find((option) => option.is_correct)?.text;
            return <article key={answer.id} className="rounded-lg border bg-white p-4"><div className="flex gap-3"><span className="mt-0.5">{answer.is_correct ? <CheckCircle2 className="size-5 text-green-600" /> : <CircleX className="size-5 text-red-600" />}</span><div className="min-w-0 flex-1"><h3 className="font-medium">{index + 1}. {question?.text ?? `Question ${answer.question_id}`}</h3><p className="mt-1 text-sm text-muted-foreground">Your answer: {selected ?? "Not answered"}</p>{!answer.is_correct && correct && <p className="text-sm text-green-700">Correct answer: {correct}</p>}</div></div></article>;
          })}
        </section>
        <Button onClick={() => navigate("/dashboard")} className="w-full">Back to dashboard</Button>
      </main>
    </div>
  );
}