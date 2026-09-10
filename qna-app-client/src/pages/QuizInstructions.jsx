import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function QuizInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    api.get(`/student/quizzes/${id}`).then(setQuiz).catch((err) => setError(err.message));
  }, [id]);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    setError("");

    try {
      const attempt = await api.post("/attempts/start", { quiz_id: id });
      // Keep the server attempt id; the server is the source of truth for timing and status.
      navigate(`/quiz/${id}/solve`, {
        state: { attemptId: attempt?.id, endTime: attempt?.end_time, questions: attempt?.questions ?? [] },
      });
    } catch (err) {
      setError(err.message || "Unable to start this quiz. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const rules = [
    { icon: Clock, label: "Duration", value: `${quiz?.duration ?? "-"} minutes` },
    { icon: FileQuestion, label: "Questions", value: `${quiz?.question_count ?? "-"} questions` },
    { icon: RotateCcw, label: "Attempts allowed", value: `${quiz?.attempts_allowed ?? 1} attempt` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-semibold">Quiz Instructions</CardTitle>
          <p className="text-sm text-muted-foreground">Review the details below before you begin.</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-4">
            {rules.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 border">
                <Icon className="w-5 h-5 mb-2 text-gray-500" />
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t pt-5">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Once you start, the timer cannot be paused or reset.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
              <p className="text-sm text-muted-foreground">
                You may leave questions unanswered and still submit the quiz.
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button onClick={handleStart} disabled={starting || !quiz} className="w-full" size="lg">
            {starting ? "Starting..." : "Start Quiz"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}