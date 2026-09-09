import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function QuizInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

 const handleStart = async () => {
  setStarting(true);
  // TEMP MOCK — replace with real POST /attempts/start once Learner 4 publishes it
  const mockAttempt = {
    attemptId: "mock-attempt-1",
    questions: [
      { id: "q1", text: "What is 2 + 2?", options: ["3", "4", "5", "6"] },
      { id: "q2", text: "What is the capital of Egypt?", options: ["Alexandria", "Cairo", "Giza", "Luxor"] },
      { id: "q3", text: "React is a...", options: ["Database", "Library", "Language", "OS"] },
    ],
  };
  setTimeout(() => {
    navigate(`/quiz/${id}/solve`, { state: mockAttempt });
  }, 400);
};

  const rules = [
    { icon: Clock, label: "Duration", value: "30 minutes" },
    { icon: FileQuestion, label: "Questions", value: "10 questions" },
    { icon: RotateCcw, label: "Attempts allowed", value: "1 attempt" },
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

          <Button onClick={handleStart} disabled={starting} className="w-full" size="lg">
            {starting ? "Starting..." : "Start Quiz"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}