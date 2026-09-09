import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

function useCountdown(seedSeconds) {
    const [remaining, setRemaining] = useState(seedSeconds);

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((s) => (s > 0 ? s - 1 : seedSeconds));
        }, 1000);
        return () => clearInterval(id);
    }, [seedSeconds]);

    return useMemo(() => {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    }, [remaining]);
}

function ExamPreviewCard() {
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

function Hero() {
    return (
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-14">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                    Scheduled assessments, role-gated by default
                </p>
                <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                    Every quiz opens on{" "}
                    <span className="text-orange-600">schedule</span>, for the{" "}
                    <span className="text-orange-600">right role</span>.
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                    Quizgate is the record system under your assessments: admins build and
                    publish, a window controls when it's live, and every request that
                    isn't an admin's gets turned away before it touches your data.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-6">
                    <Link
                        to="/register"
                        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors"
                    >
                        Start free — no card
                        <ArrowRight className="size-4" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        See the gate in action
                    </a>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                    Unlimited students. Unlimited attempts. One admin seat free, forever.
                </p>
            </div>

            <div className="flex justify-center lg:justify-end">
                <ExamPreviewCard />
            </div>
        </section>
    );
}

function BuildMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="text-sm font-semibold">New Quiz</p>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    DRAFT
                </span>
            </div>

            <div className="mt-4 space-y-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Title
                    </p>
                    <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                        Mid-term — Section B
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Opens
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            Oct 03, 14:00
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Closes
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            Oct 03, 16:00
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Duration
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            90 min
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Questions
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            32 added
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                    Publish quiz →
                </button>
            </div>
        </div>
    );
}

function ScheduleMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-orange-600" />
                Access window
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm text-muted-foreground">Before window</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        Locked
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-orange-200">
                    <span className="text-sm font-medium">During window</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Live
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm text-muted-foreground">After window</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        Closed
                    </span>
                </div>
            </div>
        </div>
    );
}

function GateMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-orange-600" />
                Role check
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">admin@board.edu</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Allowed
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">student@board.edu</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Invited
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">unknown@web.io</span>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        Denied
                    </span>
                </div>
            </div>
        </div>
    );
}

const steps = [
    {
        eyebrow: "01 / BUILD",
        title: "Build your quiz in minutes, publish when it's ready.",
        description:
            "Set a title, add questions, pick your window. Every field is validated before it goes live — no broken schedules, no silent gaps.",
        bullets: [
            "Title, duration, and time window required",
            "Questions drafted independently, attached on publish",
        ],
        mockup: BuildMockup,
    },
    {
        eyebrow: "02 / SCHEDULE",
        title: "A window controls when it's live.",
        description:
            "Nothing opens early and nothing stays open late. The moment the window closes, every link stops working automatically.",
        bullets: [
            "Opens and closes exactly on the times you set",
            "No manual toggling, no forgotten quizzes left open",
        ],
        mockup: ScheduleMockup,
    },
    {
        eyebrow: "03 / GATE",
        title: "Every request that isn't an admin's gets turned away.",
        description:
            "Role-gated by default. Students only ever see what's been published and invited to them, before it touches your data.",
        bullets: [
            "Admins can reach every quiz, published or not",
            "Everyone else sees a countdown timer instead of an error",
        ],
        mockup: GateMockup,
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="border-t border-border bg-muted/40 py-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                    How it works
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
                    Three things a quiz record actually needs to get right.
                </h2>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    Not a question builder. The spine underneath one — the part that
                    decides whether a quiz can be seen at all.
                </p>

                <div className="mt-8 space-y-10">
                    {steps.map((step, i) => (
                        <div
                            key={step.eyebrow}
                            className={cn(
                                "grid items-center gap-12 lg:grid-cols-2",
                            )}
                        >
                            <div className={cn(i % 2 === 1 && "lg:order-2")}>
                                <step.mockup />
                            </div>
                            <div className={cn(i % 2 === 1 && "lg:order-1")}>
                                <p className="text-sm font-semibold text-orange-600">{step.eyebrow}</p>
                                <h3 className="mt-2 text-3xl font-bold tracking-tight">{step.title}</h3>
                                <p className="mt-4 text-muted-foreground">{step.description}</p>
                                <ul className="mt-5 space-y-2">
                                    {step.bullets.map((b) => (
                                        <li key={b} className="flex items-start gap-2 text-sm">
                                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-600" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "/forever",
        description: "One admin seat, unlimited students, unlimited attempts.",
        features: [
            "1 admin seat",
            "Unlimited students",
            "Unlimited quiz attempts",
            "Scheduled windows",
            "Role-gated access",
        ],
        highlighted: false,
        cta: "Start free",
    },
    {
        name: "Team",
        price: "$29",
        period: "/per month",
        description: "For institutions running multiple assessments at once.",
        features: [
            "5 admin seats",
            "Everything in Free",
            "Analytics dashboard",
            "CSV exports",
            "Priority support",
        ],
        highlighted: true,
        cta: "Start free",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "contact us",
        description: "For large orgs with compliance and SSO requirements.",
        features: [
            "Unlimited admins",
            "Everything in Team",
            "SSO / SAML",
            "SLA guarantee",
        ],
        highlighted: false,
        cta: "Contact sales",
    },
];

function Pricing() {
    return (
        <section id="pricing" className="py-12">
            <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                    Pricing
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    Simple, honest pricing.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                    One admin seat free, forever. Pay only when your team grows.
                </p>

                <div className="mt-8 grid gap-6 text-left lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "flex flex-col rounded-2xl p-8 ring-1",
                                plan.highlighted
                                    ? "border-t-4 border-orange-500 bg-primary text-primary-foreground ring-transparent"
                                    : "bg-card ring-foreground/10"
                            )}
                        >
                            <p
                                className={cn(
                                    "text-xs font-semibold uppercase tracking-wide",
                                    plan.highlighted ? "text-orange-400" : "text-muted-foreground"
                                )}
                            >
                                {plan.name}
                            </p>
                            <p className="mt-3 text-4xl font-black">
                                {plan.price}
                                <span
                                    className={cn(
                                        "ml-1 text-base font-medium",
                                        plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"
                                    )}
                                >
                                    {plan.period}
                                </span>
                            </p>
                            <p
                                className={cn(
                                    "mt-3 text-sm",
                                    plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                            >
                                {plan.description}
                            </p>

                            <ul className="mt-6 flex-1 space-y-3">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm">
                                        <Check className="size-4 shrink-0 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                to="/register"
                                className={cn(
                                    "mt-8 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                                    plan.highlighted
                                        ? "bg-white text-primary hover:bg-white/90"
                                        : "bg-primary text-primary-foreground hover:bg-primary/85"
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FinalCta() {
    return (
        <section className="border-t border-border bg-muted/40 py-12 text-center">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    Ready to publish your first quiz?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    One admin seat, free forever. No credit card.
                </p>
                <Link
                    to="/register"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors"
                >
                    Start free
                    <ArrowRight className="size-4" />
                </Link>
            </div>
        </section>
    );
}

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <Hero />
            <HowItWorks />
            <Pricing />
            <FinalCta />
            <SiteFooter />
        </main>
    );
}
