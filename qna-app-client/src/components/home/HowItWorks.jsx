import { cn } from "@/lib/utils";
import GateMockup from "./GateMockup";
import ScheduleMockup from "./ScheduleMockup";
import BuildMockup from "./BuildMockup";

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

export default function HowItWorks() {
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