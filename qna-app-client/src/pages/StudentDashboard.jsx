import { useEffect, useState } from "react";
import QuizCard from "../components/QuizCard";
import { api } from "@/lib/api";

export default function StudentDashboard() {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading your quizzes...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-1">Your Quizzes</h1>
      <p className="text-muted-foreground mb-6">Pick up where you left off, or start something new.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
      {!quizzes.length && <p className="text-muted-foreground">No quizzes are available yet.</p>}
    </div>
  );
}