import { useNavigate } from "react-router";
import { CalendarClock, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/useNow";
import { formatDateTime, formatDuration, quizWindowState } from "@/lib/quizStatus";
import { cn } from "@/lib/utils";

const stateStyles = {
  not_started: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  submitted: "bg-green-100 text-green-700",
};

const stateLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
};

// What the student can do right now, based on the quiz window and their attempt.
function availabilityLine(quiz, now) {
  const window = quizWindowState({ starts_at: quiz.starts_at, ends_at: quiz.deadline }, now);
  if (quiz.state === "submitted") return { text: "Completed", tone: "text-green-700" };
  if (window === "upcoming") {
    return { text: `Opens in ${formatDuration(new Date(quiz.starts_at) - now)}`, tone: "text-blue-700" };
  }
  if (window === "closed") return { text: "Closed — the deadline has passed", tone: "text-red-700" };
  return {
    text: `${quiz.state === "in_progress" ? "In progress" : "Open now"} · closes in ${formatDuration(new Date(quiz.deadline) - now)}`,
    tone: "text-green-700",
  };
}

export default function QuizCard({ quiz }) {
  const navigate = useNavigate();
  const now = useNow();
  const availability = availabilityLine(quiz, now);

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/quiz/${quiz.id}/instructions`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") navigate(`/quiz/${quiz.id}/instructions`);
      }}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:-translate-y-0.5"
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
          <Badge className={stateStyles[quiz.state]}>
            {stateLabels[quiz.state] ?? quiz.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Timer className="size-4" /> {quiz.duration} minutes
        </p>
        {quiz.starts_at && (
          <p className="flex items-center gap-2">
            <CalendarClock className="size-4" /> {formatDateTime(quiz.starts_at)} → {formatDateTime(quiz.deadline)}
          </p>
        )}
        <p className={cn("pt-1 font-semibold", availability.tone)}>{availability.text}</p>
      </CardContent>
    </Card>
  );
}
