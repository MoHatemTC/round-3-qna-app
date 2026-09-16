import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function QuizInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-semibold">Quiz Instructions</CardTitle>
          <p className="text-sm text-muted-foreground">Review the details below before you begin.</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">Once you start, the timer cannot be paused or reset — it keeps running even if you leave or refresh the page.</p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
              <p className="text-sm text-muted-foreground">You may leave questions unanswered and still submit.</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/quiz/${id}/solve`)} className="w-full" size="lg">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}