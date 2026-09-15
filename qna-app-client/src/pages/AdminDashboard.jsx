import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { ArrowRight, CircleAlert, CircleCheck, ClipboardList, ListChecks, Plus, Target } from "lucide-react"
import { getAdminAttempts, getQuizzes } from "@/services/services"
import { useSession } from "@/context/session"
import { useNow } from "@/hooks/useNow"
import { getQuizActivation, questionCount } from "@/lib/quizStatus"
import QuizStatusBadge from "@/components/admin/QuizStatusBadge"
import { AdminCard, AdminPageHeader, adminPrimaryButton } from "@/components/admin/AdminLayout"

function StatCard({ icon: Icon, label, value, hint, tone = "orange" }) {
  const tones = {
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
    green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  }
  return (
    <AdminCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-black tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </AdminCard>
  )
}

export default function AdminDashboard() {
  const { user } = useSession()
  const now = useNow()
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([getQuizzes(), getAdminAttempts()])
      .then(([quizData, attemptData]) => {
        if (!active) return
        setQuizzes(Array.isArray(quizData) ? quizData : [])
        setAttempts(Array.isArray(attemptData) ? attemptData : [])
      })
      .catch((err) => active && setError(err.message || "Unable to load the dashboard."))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const activeQuizzes = quizzes.filter((quiz) => getQuizActivation(quiz, now).active)
    const needsQuestions = quizzes.filter((quiz) => questionCount(quiz) === 0)
    const scored = attempts.filter((attempt) => attempt.percentage != null)
    const average = scored.length
      ? scored.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / scored.length
      : null
    return { activeQuizzes, needsQuestions, average }
  }, [quizzes, attempts, now])

  const firstName = user?.name?.split(" ")[0]

  return (
    <>
      <AdminPageHeader
        eyebrow="Dashboard"
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="An overview of your quizzes and how students are doing."
        actions={
          <Link to="/admin-panel/quizzes" state={{ openCreate: true }} className={adminPrimaryButton}>
            <Plus /> New quiz
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading dashboard...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ClipboardList} label="Total quizzes" value={quizzes.length} />
            <StatCard
              icon={CircleCheck}
              tone="green"
              label="Active quizzes"
              value={stats.activeQuizzes.length}
              hint="Published, with questions, window open"
            />
            <StatCard
              icon={CircleAlert}
              tone="red"
              label="Need questions"
              value={stats.needsQuestions.length}
              hint="Can't be published yet"
            />
            <StatCard
              icon={Target}
              label="Average score"
              value={stats.average == null ? "—" : `${stats.average.toFixed(1)}%`}
              hint={`${attempts.length} total attempts`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-bold">Needs your attention</h2>
                <Link to="/admin-panel/quizzes" className="text-sm font-semibold text-orange-600 hover:underline">
                  All quizzes →
                </Link>
              </div>
              {quizzes.filter((quiz) => !getQuizActivation(quiz, now).active).length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {quizzes.length ? "Every quiz is active. Nice work." : "No quizzes yet — create your first one."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {quizzes
                    .filter((quiz) => !getQuizActivation(quiz, now).active)
                    .slice(0, 5)
                    .map((quiz) => (
                      <li key={quiz.id} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{quiz.title}</p>
                          <QuizStatusBadge quiz={quiz} className="mt-1" />
                        </div>
                        <Link
                          to={`/admin-panel/quizzes/${quiz.id}/questions`}
                          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-600 hover:underline"
                        >
                          {questionCount(quiz) === 0 ? "Add question" : "Open"} <ArrowRight className="size-3.5" />
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-bold">Recent attempts</h2>
                <Link to="/admin-panel/attempts" className="text-sm font-semibold text-orange-600 hover:underline">
                  All attempts →
                </Link>
              </div>
              {attempts.length === 0 ? (
                <p className="flex flex-col items-center gap-2 px-5 py-8 text-center text-sm text-muted-foreground">
                  <ListChecks className="size-5" />
                  No attempts yet. They'll show up here once students start quizzes.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {attempts.slice(0, 5).map((attempt) => (
                    <li key={attempt.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{attempt.user?.name ?? "Unknown student"}</p>
                        <p className="truncate text-xs text-muted-foreground">{attempt.quiz?.title ?? "Unknown quiz"}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {attempt.percentage == null ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            {attempt.status.replaceAll("_", " ")}
                          </span>
                        ) : (
                          `${Number(attempt.percentage).toFixed(1)}%`
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </div>
      )}
    </>
  )
}
