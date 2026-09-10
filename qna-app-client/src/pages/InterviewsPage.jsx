import { Link } from "react-router";
import {
    ArrowUpRight,
    CircleDot,
    Diamond,
    Hexagon,
    Target,
    Timer,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InlineCta from "@/components/InlineCta";

const formats = [
    {
        title: "Technical screen",
        duration: "30 min",
        bestFor: "Best for: early pipeline filter",
        description:
            "A focused coding challenge with auto-grading. Candidate completes it independently within a set window.",
    },
    {
        title: "Live interview",
        duration: "45–60 min",
        bestFor: "Best for: mid-pipeline depth",
        description:
            "Real-time collaborative session. Interviewer and candidate solve problems together with full IDE and whiteboard access.",
    },
    {
        title: "Take-home project",
        duration: "2–4 hrs",
        bestFor: "Best for: senior / specialist roles",
        description:
            "Candidate completes a scoped project asynchronously. Submitted for review with a replay of their work session.",
    },
    {
        title: "Async video",
        duration: "15–20 min",
        bestFor: "Best for: culture & communication fit",
        description:
            "Candidate records answers to structured questions on video. No scheduling friction for either party.",
    },
];

const included = [
    {
        icon: CircleDot,
        title: "Live collaborative coding",
        description:
            "Conduct real-time technical interviews with a shared IDE. Both interviewer and candidate write, run, and debug code together in the same environment.",
    },
    {
        icon: Hexagon,
        title: "Async video interviews",
        description:
            "Send candidates a set of questions they record on their own time. Review responses on your schedule — no calendar coordination required.",
    },
    {
        icon: Diamond,
        title: "Structured scorecards",
        description:
            "Rate candidates on predefined criteria — technical accuracy, communication, problem-solving approach — immediately after each interview with no recollection lag.",
    },
    {
        icon: Target,
        title: "Private interviewer notes",
        description:
            "Interviewers can take private notes during the session that only the hiring team sees. Candidates never have access to evaluator feedback.",
    },
    {
        icon: ArrowUpRight,
        title: "Session recordings",
        description:
            "Every live interview is recorded with the candidate's consent. Replay the coding session, whiteboard diagrams, and video at any time for team review.",
    },
    {
        icon: Timer,
        title: "Whiteboard & system design",
        description:
            "Draw architecture diagrams, flowcharts, and system designs in an interactive whiteboard — built directly into the interview room, no third-party tool needed.",
    },
];

export default function InterviewsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <SiteHeader />

            <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
                <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to home
                </Link>

                <h1 className="mt-6 text-6xl font-black tracking-tight sm:text-7xl">
                    Interviews
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                    From async screens to live collaborative sessions — Quizgate gives
                    your team a structured, bias-reducing interview process without the
                    scheduling chaos.
                </p>

                <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Interview formats
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {formats.map((format) => (
                        <div key={format.title} className="rounded-2xl bg-muted p-8">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="text-xl font-bold tracking-tight">
                                    {format.title}
                                </h3>
                                <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                    {format.duration}
                                </span>
                            </div>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                                {format.bestFor}
                            </p>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {format.description}
                            </p>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    What's included
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {included.map((feature) => (
                        <div key={feature.title} className="rounded-2xl bg-muted p-8">
                            <feature.icon className="size-6 text-orange-500" />
                            <h3 className="mt-4 text-lg font-bold tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <InlineCta
                        title="Ready to run your first interview?"
                        subtitle="One admin seat free. No credit card required."
                    />
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
