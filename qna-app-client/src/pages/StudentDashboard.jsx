import { useEffect, useState } from "react";
import QuizCard from "../components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useSession } from "@/context/session";

export default function StudentDashboard() {
  const { user } = useSession();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/student/quizzes")
      .then((data) => {
        if (active) setQuizzes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load quizzes.");
      })
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, []);

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="min-h-[calc(100vh-4rem)] bg-muted/40">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Dashboard</p>
          <h1 className="mt-1 mb-1 text-3xl font-black tracking-tight">
            {firstName ? `Hi ${firstName}, here are your quizzes` : "Your Quizzes"}
          </h1>
          <p className="text-muted-foreground mb-6">Pick up where you left off, or start something new.</p>

          {loading && <p className="text-muted-foreground">Loading your quizzes...</p>}
          {error && <p role="alert" className="text-destructive">{error}</p>}

          {!loading && !error && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
              {!quizzes.length && <p className="text-muted-foreground">No quizzes are available yet.</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
