import { useLocation, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function QuizResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // TEMP MOCK — replace with real fields once /attempts/{id}/submit is live
  const score = state?.score ?? 2;
  const total = state?.total ?? 3;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
          <CardTitle className="text-2xl">Quiz Submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-bold">
            {score} / {total}
          </p>
          <p className="text-sm text-muted-foreground">
            Your responses have been recorded.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}