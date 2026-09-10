import { Link } from "react-router";
import {
    ArrowUpRight,
    Diamond,
    Hexagon,
    Shield,
    Target,
    Timer,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InlineCta from "@/components/InlineCta";

const stats = [
    { value: "40+", label: "Supported languages" },
    { value: "10k+", label: "Question library" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<2s", label: "Avg. grading time" },
];

const features = [
    {
        icon: Diamond,
        title: "Auto-graded challenges",
        description:
            "Every submission is scored instantly — no manual review needed. Supports coding, multiple choice, free-form written responses, and spreadsheet tasks across 40+ languages.",
    },
    {
        icon: Timer,
        title: "Scheduled access windows",
        description:
            "Set a precise open and close time for each assessment. Candidates outside the window see a locked state with a countdown — no early access, no late submissions.",
    },
    {
        icon: Shield,
        title: "Role-gated by default",
        description:
            "Admins build and publish. Students take. The two roles never overlap. Exam content is invisible to candidates until the window opens, eliminating leaks before they happen.",
    },
    {
        icon: Target,
        title: "Question library",
        description:
            "Choose from thousands of pre-built questions across software engineering, data science, product thinking, and operations — or write your own and save them for reuse.",
    },
    {
        icon: Hexagon,
        title: "Custom question types",
        description:
            "Mix coding challenges, video responses, personality questions, diagram whiteboards, and free-form essays in a single assessment to evaluate the full candidate profile.",
    },
    {
        icon: ArrowUpRight,
        title: "Real-time analytics",
        description:
            "Track completion rates, average scores, per-question drop-off, and time-on-task across every active assessment. Export results to CSV with one click.",
    },
];

const flow = [
    {
        step: "01",
        title: "Admin creates the quiz",
        description:
            "Choose questions from the library or write your own. Set duration, question count, and grading weights.",
    },
    {
        step: "02",
        title: "Set the access window",
        description:
            "Pick your open date/time and close date/time. The quiz is invisible to students until the window opens.",
    },
    {
        step: "03",
        title: "Publish & invite students",
        description:
            "Students are notified by email. They log in and see a countdown to their scheduled window.",
    },
    {
        step: "04",
        title: "Students take the quiz",
        description:
            "During the window, students access the quiz. The timer runs and submissions are locked when time expires.",
    },
    {
        step: "05",
        title: "Auto-graded results",
        description:
            "Scores, per-question breakdowns, and analytics appear in your admin dashboard within seconds of submission.",
    },
];

export default function AssessmentsPage() {
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
                    Assessments
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                    Build, schedule, and grade assessments in minutes. Quizgate handles
                    access control and scoring automatically — you focus on what the
                    results actually mean.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-muted px-6 py-8 text-center">
                            <p className="text-3xl font-black text-orange-600 sm:text-4xl">
                                {stat.value}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {features.map((feature) => (
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

                <div className="mt-8 rounded-2xl bg-muted p-10">
                    <h2 className="text-3xl font-black tracking-tight">
                        How an assessment flows
                    </h2>
                    <div className="mt-6 divide-y divide-border">
                        {flow.map((item) => (
                            <div key={item.step} className="flex gap-6 py-5 first:pt-0 last:pb-0">
                                <span className="shrink-0 text-sm font-black text-orange-600">
                                    {item.step}
                                </span>
                                <div>
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <InlineCta
                        title="Ready to publish your first assessment?"
                        subtitle="One admin seat free. No credit card required."
                    />
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
