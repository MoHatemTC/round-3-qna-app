import { useEffect, useMemo, useState } from "react";
import { getAdminAttempts } from "@/services/services";
import { AdminCard, AdminPageHeader, adminInput } from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

const statusStyles = {
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  submitted: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  auto_submitted: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

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

  const controlClass = `${adminInput} mt-0 h-10`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Attempts & results"
        title="Student attempts"
        description="Review student submissions and scores."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student or quiz"
          aria-label="Search student or quiz"
          className={cn(controlClass, "flex-1")}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={cn(controlClass, "sm:w-44")}>
          <option value="all">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="submitted">Submitted</option>
          <option value="auto_submitted">Auto submitted</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort attempts" className={cn(controlClass, "sm:w-40")}>
          <option value="newest">Newest</option>
          <option value="score">Highest score</option>
        </select>
      </div>

      {loading && <p className="text-muted-foreground">Loading attempts...</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  {["Student", "Quiz", "Status", "Score", "Started", "Submitted"].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="px-5 py-3">
                      <div className="font-semibold">{attempt.user?.name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{attempt.user?.email}</div>
                    </td>
                    <td className="px-5 py-3">{attempt.quiz?.title ?? "Unknown quiz"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusStyles[attempt.status])}>
                        {attempt.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {attempt.percentage == null ? "—" : `${Number(attempt.percentage).toFixed(1)}%`}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(attempt.started_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <p className="p-8 text-center text-muted-foreground">No attempts match these filters.</p>
          )}
        </AdminCard>
      )}
    </>
  );
}
