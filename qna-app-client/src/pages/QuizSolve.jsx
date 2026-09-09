import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuizSolve() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const attemptId = state?.attemptId;
  const questions = state?.questions ?? [];

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return; // duplicate-submit guard
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/attempts/${attemptId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setSubmitted(true);
      navigate(`/quiz/${id}/result`, { state: data });
    } catch (err) {
      setSubmitting(false);
      alert("Submission failed. Try again.");
    }
  };

  if (!attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        No active attempt found. Please start the quiz again from the instructions page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-4 max-w-2xl mx-auto">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {i + 1}. {q.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => selectAnswer(q.id, opt)}
                className={`w-full text-left px-4 py-2 rounded-md border text-sm transition-colors ${
                  answers[q.id] === opt
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
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