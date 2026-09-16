import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRemainingMs, hasExpired } from "./quizTimer";

export default function QuizSolve() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetch("http://localhost:3000/attempts/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: quizId }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e));
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setAttempt(data);
        setRemainingMs(getRemainingMs(data.end_time));
      })
      .catch((err) => active && setError(err?.message || "Couldn't start this attempt."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [quizId]);

  const buildPayload = useCallback(() => ({
    answers: Object.entries(answers).map(([question_id, value]) => ({
      question_id,
      ...value,
    })),
  }), [answers]);

  const doSubmit = useCallback(() => {
    if (submittingRef.current || !attempt) return;
    submittingRef.current = true;
    fetch(`http://localhost:3000/attempts/${attempt.id}/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    })
      .then((res) => res.json())
      .then((data) => navigate(`/quiz/${quizId}/result`, { state: data }))
      .catch(() => {
        submittingRef.current = false;
        alert("Submission failed. Please try again.");
      });
  }, [attempt, buildPayload, navigate, quizId]);

  useEffect(() => {
    if (!attempt) return;
    const tick = () => {
      const left = getRemainingMs(attempt.end_time);
      setRemainingMs(left);
      if (hasExpired(attempt.end_time)) doSubmit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt, doSubmit]);

  useEffect(() => {
    if (!attempt) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const left = getRemainingMs(attempt.end_time);
        setRemainingMs(left);
        if (hasExpired(attempt.end_time)) doSubmit();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attempt, doSubmit]);

  const selectMcq = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId } }));
  };
  const selectBoolean = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { boolean_answer: value } }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading your quiz...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!attempt) return null;

  const questions = attempt.questions;
  const answeredCount = Object.keys(answers).length;
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isWarning = totalSeconds <= 120;

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-4 max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-gray-50 pb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {questions.length} answered
        </span>
        <span className={`font-mono text-lg font-semibold ${isWarning ? "text-red-600" : ""}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      {isWarning && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
          Less than 2 minutes remaining — your answers will auto-submit at zero.
        </div>
      )}

      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">{i + 1}. {q.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.type === "mcq" && q.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectMcq(q.id, opt.id)}
                className={`w-full text-left px-4 py-2 rounded-md border text-sm transition-colors ${
                  answers[q.id]?.selected_option_id === opt.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.text}
              </button>
            ))}
            {q.type === "true_false" && ["true", "false"].map((val) => (
              <button
                key={val}
                onClick={() => selectBoolean(q.id, val === "true")}
                className={`w-full text-left px-4 py-2 rounded-md border text-sm capitalize transition-colors ${
                  answers[q.id]?.boolean_answer === (val === "true")
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {val}
              </button>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button onClick={doSubmit} disabled={submittingRef.current} className="w-full" size="lg">
        Submit Quiz
      </Button>
    </div>
  );
}