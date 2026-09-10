import { useCountdown } from "@/hooks/CountDownHook";

export default function ExamPreviewCard() {
    const countdown = useCountdown(6 * 3600 + 56 * 60 + 38);

    return (
        <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold leading-snug">
                    Placement Exam — Cohort 14
                </h3>
                <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    PUBLISHED
                </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
                45 questions · logic, aptitude, written response
            </p>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Window
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                        Sep 12, 09:00 → 11:00
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Closes in
                    </p>
                    <p className="font-mono text-lg font-bold text-orange-600">{countdown}</p>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>120 min duration</span>
                <span>212 invited</span>
                <span>admin@board.edu</span>
            </div>
        </div>
    );
}