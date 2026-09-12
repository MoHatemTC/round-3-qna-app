import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function QuizSolve() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const attemptId = state?.attemptId;
  const questions = state?.questions ?? [];

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return; // duplicate-submit guard
    const payload = questions
      .map((question) => {
        const selected = answers[question.id];
        if (selected === undefined) return null;
        if (question.type === "true_false") {
          return { question_id: question.id, boolean_answer: selected === true || selected === "True" };
        }
        return { question_id: question.id, selected_option_id: selected?.id ?? selected };
      })
      .filter(Boolean);

    if (payload.length === 0) {
      setError("Select at least one answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const data = await api.post(`/attempts/${attemptId}/submit`, { answers: payload });
      setSubmitted(true);
      navigate(`/quiz/${id}/result`, { state: data });
    } catch (err) {
      setSubmitting(false);
      // Keep the attempt open after a server/network failure so the learner can retry.
      setError(err.message || "Submission failed. Try again.");
    }
  };

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
    <div className="min-h-screen bg-gray-50 p-8 space-y-4 max-w-2xl mx-auto">
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
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
              const optionLabel = opt.text ?? opt;
              return (
              <button
                key={optionKey}
                type="button"
                onClick={() => selectAnswer(q.id, opt)}
                className={`w-full text-left px-4 py-2 rounded-md border text-sm transition-colors ${
                  answers[q.id] === opt || answers[q.id]?.id === opt?.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {optionLabel}
              </button>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitting || submitted}
        className="w-full"
        size="lg"
      >
        {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Quiz"}
      </Button>
    </div>
  );
}