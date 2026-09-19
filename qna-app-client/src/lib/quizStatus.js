// Derives what the admin needs to know about a quiz at a glance:
// is it active (students can see and take it) and, if not, why.
//
// Active = published + at least one question + its window hasn't ended.

export function questionCount(quiz) {
  return quiz?._count?.questions ?? 0
}

// "upcoming" | "open" | "closed" - mirrors quizAvailability() on the server.
export function quizWindowState(quiz, now = new Date()) {
  if (now < new Date(quiz.starts_at)) return "upcoming"
  if (now > new Date(quiz.ends_at)) return "closed"
  return "open"
}

// Live = students could be taking it right now, so questions are locked.
export function isQuizLive(quiz, now = new Date()) {
  return quiz.status === "published" && quizWindowState(quiz, now) === "open"
}

export function hasEnded(quiz, now = new Date()) {
  return new Date(quiz.ends_at) <= now
}

// Compact "3d 4h", "2h 15m", "45m", "less than a minute".
export function formatDuration(ms) {
  const minutes = Math.floor(Math.abs(ms) / 60_000)
  if (minutes < 1) return "less than a minute"
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`
  if (hours) return mins ? `${hours}h ${mins}m` : `${hours}h`
  return `${mins}m`
}

export function getQuizActivation(quiz, now = new Date()) {
  const questions = questionCount(quiz)
  const startsAt = new Date(quiz.starts_at)
  const endsAt = new Date(quiz.ends_at)

  if (endsAt <= now) {
    return { active: false, label: "Inactive", reason: `Window ended ${formatDuration(now - endsAt)} ago` }
  }
  if (questions === 0) {
    return { active: false, label: "Inactive", reason: "Needs at least one question" }
  }
  if (quiz.status !== "published") {
    return { active: false, label: "Inactive", reason: "Draft — not published" }
  }
  if (startsAt > now) {
    return { active: true, label: "Active", reason: `Scheduled — opens in ${formatDuration(startsAt - now)}` }
  }
  return { active: true, label: "Active", reason: `Live now — closes in ${formatDuration(endsAt - now)}` }
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// Client-side mirror of the server's schedule rules, so the admin sees problems
// while filling in the form. Returns a list of messages (empty = valid).
export function scheduleProblems({ starts_at, ends_at, duration_minutes }, { isNew, publishing }, now = new Date()) {
  const problems = []
  if (!starts_at || !ends_at) return problems

  const startsAt = new Date(starts_at)
  const endsAt = new Date(ends_at)
  const windowMinutes = (endsAt - startsAt) / 60_000

  if (endsAt <= startsAt) {
    problems.push("The end time must be after the start time.")
  } else if (Number(duration_minutes) > windowMinutes) {
    problems.push(
      `Duration (${duration_minutes} min) is longer than the window (${Math.floor(windowMinutes)} min).`
    )
  }
  if ((isNew || publishing) && endsAt <= now) {
    problems.push(
      isNew ? "The end time must be in the future." : "The end time has passed — set a later end time to publish."
    )
  }
  return problems
}
