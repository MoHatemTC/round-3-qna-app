import type { PrismaService } from "../prisma.service.js";
import { AttemptStatus } from "../generated/prisma/enums.js";

// A submission sent this long after the deadline is still accepted, so the
// client's auto-submit at 00:00 isn't lost to network latency.
export const SUBMIT_GRACE_MS = 30_000;

// An attempt ends at started_at + duration, or when the quiz window closes,
// whichever comes first.
export function computeAttemptEndTime(
  startedAt: Date,
  durationMinutes: number,
  quizEndsAt: Date
) {
  const byDuration = new Date(startedAt.getTime() + durationMinutes * 60_000);
  return byDuration < quizEndsAt ? byDuration : quizEndsAt;
}

export type QuizAvailability = "upcoming" | "open" | "closed";

export function quizAvailability(
  quiz: { starts_at: Date; ends_at: Date },
  now = new Date()
): QuizAvailability {
  if (now < quiz.starts_at) return "upcoming";
  if (now > quiz.ends_at) return "closed";
  return "open";
}

// Attempts are only written on submit, so an in-progress attempt whose time ran
// out (tab closed, connection lost) would stay "in progress" forever. Close
// those out as auto-submitted with no answers. Called lazily before reads.
export async function finalizeExpiredAttempts(
  prisma: PrismaService,
  where: { id?: string; quiz_id?: string; user_id?: string } = {}
) {
  const open = await prisma.attempt.findMany({
    where: { ...where, status: AttemptStatus.in_progress },
    select: {
      id: true,
      started_at: true,
      quiz: { select: { duration_minutes: true, ends_at: true } }
    }
  });

  const now = Date.now();
  const expired = open
    .map((attempt) => ({
      id: attempt.id,
      endTime: computeAttemptEndTime(
        attempt.started_at,
        attempt.quiz.duration_minutes,
        attempt.quiz.ends_at
      )
    }))
    .filter(({ endTime }) => now > endTime.getTime() + SUBMIT_GRACE_MS);

  if (!expired.length) return;

  await prisma.$transaction(
    expired.map(({ id, endTime }) =>
      prisma.attempt.update({
        where: { id },
        data: {
          status: AttemptStatus.auto_submitted,
          submitted_at: endTime,
          score: 0,
          percentage: 0
        }
      })
    )
  );
}
