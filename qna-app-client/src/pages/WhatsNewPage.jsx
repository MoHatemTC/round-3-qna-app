import { Link } from "react-router";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InlineCta from "@/components/InlineCta";

const badgeStyles = {
    NEW: "bg-green-100 text-green-700",
    IMPROVED: "bg-orange-100 text-orange-700",
    FIX: "bg-blue-100 text-blue-700",
};

const entries = [
    {
        version: "v1.4",
        date: "Sep 2026",
        badge: "NEW",
        title: "Role-gated access overhaul",
        description:
            "Admins can now define granular access windows per cohort. Students outside the scheduled window see a locked state with a countdown timer instead of an error.",
    },
    {
        version: "v1.3",
        date: "Aug 2026",
        badge: "IMPROVED",
        title: "Exam builder redesign",
        description:
            "The quiz creation flow has been rebuilt from scratch — drag-and-drop question ordering, bulk import via CSV, and live preview mode are now available.",
    },
    {
        version: "v1.2",
        date: "Jul 2026",
        badge: "NEW",
        title: "Analytics dashboard",
        description:
            "Track completion rates, average scores, time-on-question, and drop-off points across all active assessments in real time.",
    },
    {
        version: "v1.1",
        date: "Jun 2026",
        badge: "FIX",
        title: "Countdown timer accuracy",
        description:
            "Resolved a drift issue where timers could fall behind by up to 4 seconds on low-end devices under heavy network load.",
    },
];

export default function WhatsNewPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <SiteHeader />

            <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
                <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to home
                </Link>

                <h1 className="mt-6 text-6xl font-black tracking-tight sm:text-7xl">
                    What's new
                </h1>

                <div className="mt-8 divide-y divide-border">
                    {entries.map((entry) => (
                        <div
                            key={entry.version}
                            className="grid gap-2 py-10 first:pt-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-6"
                        >
                            <div>
                                <p className="font-bold">{entry.version}</p>
                                <p className="text-sm text-muted-foreground">{entry.date}</p>
                            </div>
                            <div>
                                <span
                                    className={cn(
                                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                        badgeStyles[entry.badge]
                                    )}
                                >
                                    {entry.badge}
                                </span>
                                <h3 className="mt-3 text-2xl font-bold tracking-tight">
                                    {entry.title}
                                </h3>
                                <p className="mt-3 text-muted-foreground">{entry.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <InlineCta
                        title="Ready to try what's new?"
                        subtitle="One admin seat free. No credit card required."
                    />
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
