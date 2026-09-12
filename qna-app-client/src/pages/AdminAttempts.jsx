import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { getAdminAttempts } from "@/services/services";

export default function AdminAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminAttempts()
      .then((data) => setAttempts(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Unable to load attempts."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => attempts
    .filter((attempt) => {
      const matchesStatus = status === "all" || attempt.status === status;
      const haystack = `${attempt.user?.name ?? ""} ${attempt.user?.email ?? ""} ${attempt.quiz?.title ?? ""}`.toLowerCase();
      return matchesStatus && haystack.includes(query.toLowerCase());
    })
    .sort((left, right) => sort === "score"
      ? (right.percentage ?? -1) - (left.percentage ?? -1)
      : new Date(right.started_at) - new Date(left.started_at)),
  [attempts, query, sort, status]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link to="/admin-panel" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Quizzes</Link>
        <h1 className="text-2xl font-semibold">Attempts</h1>
        <p className="text-sm text-muted-foreground">Review student submissions and scores.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or quiz" className="h-9 flex-1 rounded-md border bg-background px-3 text-sm" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="submitted">Submitted</option><option value="auto_submitted">Auto submitted</option></select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="newest">Newest</option><option value="score">Highest score</option></select>
      </div>
      {loading && <p>Loading attempts...</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!loading && !error && <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full min-w-175 text-left text-sm"><thead className="border-b bg-muted/40"><tr>{["Student", "Quiz", "Status", "Score", "Started", "Submitted"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y">{filtered.map((attempt) => <tr key={attempt.id}><td className="px-4 py-3"><div className="font-medium">{attempt.user?.name ?? "Unknown"}</div><div className="text-muted-foreground">{attempt.user?.email}</div></td><td className="px-4 py-3">{attempt.quiz?.title ?? "Unknown quiz"}</td><td className="px-4 py-3">{attempt.status.replaceAll("_", " ")}</td><td className="px-4 py-3">{attempt.percentage == null ? "-" : `${Number(attempt.percentage).toFixed(1)}%`}</td><td className="px-4 py-3">{new Date(attempt.started_at).toLocaleString()}</td><td className="px-4 py-3">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "-"}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-6 text-center text-muted-foreground">No attempts match these filters.</p>}</div>}
    </main>
  );
}