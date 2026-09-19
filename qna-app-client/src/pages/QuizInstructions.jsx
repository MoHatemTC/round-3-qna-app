import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Clock, FileQuestion, RotateCcw, AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";

import { api } from "@/lib/api";

import { startAttempt } from "@/services/services";

import { useNow } from "@/hooks/useNow";

import { formatDateTime, formatDuration, quizWindowState } from "@/lib/quizStatus";


export default function QuizInstructions() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [starting, setStarting] = useState(false);

  const [error, setError] = useState("");

  const [quiz, setQuiz] = useState(null);

  // Difference between the server clock and this device, so a wrong local

  // clock can't make the Start button appear early or late.

  const [clockOffset, setClockOffset] = useState(0);

  const localNow = useNow(1000);

  const now = new Date(localNow.getTime() + clockOffset);


  useEffect(() => {

    api.get(`/student/quizzes/${id}`)

      .then((data) => {

        setQuiz(data);

        if (data?.server_time) setClockOffset(new Date(data.server_time).getTime() - Date.now());

      })

      .catch((err) => setError(err.message));

  }, [id]);


  const windowState = quiz ? quizWindowState(quiz, now) : null;

  const alreadySubmitted = quiz?.state === "submitted";

  const inProgress = quiz?.state === "in_progress";

  const canStart = Boolean(quiz) && windowState === "open" && !alreadySubmitted;


  const handleStart = async () => {

    if (starting || !canStart) return;

    setStarting(true);

    setError("");


    try {

      const attempt = await startAttempt(id);

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


  let buttonLabel = "Start Quiz";

  if (starting) buttonLabel = inProgress ? "Resuming..." : "Starting...";

  else if (!quiz) buttonLabel = "Loading...";

  else if (alreadySubmitted) buttonLabel = "Already submitted";

  else if (windowState === "upcoming") buttonLabel = `Opens in ${formatDuration(new Date(quiz.starts_at) - now)}`;

  else if (windowState === "closed") buttonLabel = "This quiz has closed";

  else if (inProgress) buttonLabel = "Resume Quiz";


  const minutesUntilClose = quiz ? (new Date(quiz.ends_at) - now) / 60_000 : 0;

  const cutShort = windowState === "open" && !inProgress && minutesUntilClose < quiz?.duration;


  return (

    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">

      <Card className="max-w-xl w-full">

        <CardHeader className="border-b">

          <CardTitle className="text-2xl font-semibold">{quiz?.title ?? "Quiz Instructions"}</CardTitle>

          <p className="text-sm text-muted-foreground">Review the details below before you begin.</p>

        </CardHeader>


        <CardContent className="space-y-6 pt-6">

          <div className="grid grid-cols-3 gap-4">

            {rules.map(({ icon: Icon, label, value }) => (

              <div key={label} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/60 border">

                <Icon className="w-5 h-5 mb-2 text-muted-foreground" />

                <span className="text-xs text-muted-foreground">{label}</span>

                <span className="text-sm font-medium">{value}</span>

              </div>

            ))}

          </div>


          {quiz && (

            <div className="flex gap-3 items-start rounded-lg border p-4">

              <CalendarClock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />

              <div className="text-sm">

                <p className="font-medium">

                  {formatDateTime(quiz.starts_at)} → {formatDateTime(quiz.ends_at)}

                </p>

                <p className="text-muted-foreground">

                  {windowState === "upcoming" && `Opens in ${formatDuration(new Date(quiz.starts_at) - now)}.`}

                  {windowState === "open" && `Open now — closes in ${formatDuration(new Date(quiz.ends_at) - now)}.`}

                  {windowState === "closed" && "The deadline has passed."}

                </p>

              </div>

            </div>

          )}


          <div className="space-y-3 border-t pt-5">

            <div className="flex gap-3 items-start">

              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />

              <p className="text-sm text-muted-foreground">

                Once you start, the timer cannot be paused or reset. It ends after {quiz?.duration ?? "-"} minutes

                or when the quiz closes, whichever comes first, and your answers are submitted automatically.

              </p>

            </div>

            {cutShort && (

              <div className="flex gap-3 items-start">

                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />

                <p className="text-sm font-medium text-red-700">

                  The quiz closes in {formatDuration(new Date(quiz.ends_at) - now)}, so you'll have less than the full {quiz.duration} minutes.

                </p>

              </div>

            )}

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


          <Button onClick={handleStart} disabled={starting || !canStart} className="w-full" size="lg">

            {buttonLabel}

          </Button>

          {alreadySubmitted && (

            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>

              Back to dashboard

            </Button>

          )}

        </CardContent>

      </Card>

    </div>

  );

}