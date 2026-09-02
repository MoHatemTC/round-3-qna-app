import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function QuizCard({ quiz }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
          <Badge className={stateStyles[quiz.state]}>
            {stateLabels[quiz.state] ?? quiz.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>⏱ {quiz.duration} minutes</p>
        <p>📅 Due {quiz.deadline}</p>
      </CardContent>
    </Card>
  );
}