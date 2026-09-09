import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const faqs = [
    {
        question: "How do I create a scheduled quiz?",
        answer:
            "Go to the admin dashboard, click 'New Quiz', set your open and close window under the Schedule tab, then publish. Students will only see the quiz during the active window.",
    },
    {
        question: "Can students access a quiz outside the scheduled window?",
        answer:
            "No. Quizgate enforces access at the server level. Outside the window, students see a countdown to the next open slot — no workarounds possible.",
    },
    {
        question: "How do role assignments work?",
        answer:
            "When you add a user, you assign them either Admin or Student. Admins can create, edit, and publish quizzes. Students can only view and take quizzes assigned to them.",
    },
    {
        question: "Is there a limit on the number of students per quiz?",
        answer:
            "On the Free plan, there is no limit on students. All plans support unlimited quiz attempts per student.",
    },
    {
        question: "How do I export results?",
        answer:
            "From the quiz analytics page, click 'Export CSV'. You'll get per-student scores, time-on-question breakdowns, and completion timestamps.",
    },
    {
        question: "Can I reuse questions across quizzes?",
        answer:
            "Yes. Save any question to your Question Library and import it into future quizzes with one click.",
    },
];

export default function HelpCenterPage() {
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
                    Help center
                </h1>

                <div className="mt-8 divide-y divide-border">
                    {faqs.map((faq) => (
                        <div key={faq.question} className="py-8 first:pt-0 last:pb-0">
                            <h3 className="text-xl font-bold tracking-tight">
                                {faq.question}
                            </h3>
                            <p className="mt-3 text-muted-foreground">{faq.answer}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-2xl bg-muted p-10">
                    <h2 className="text-2xl font-black tracking-tight">Still need help?</h2>
                    <p className="mt-2 text-muted-foreground">
                        Our team responds within one business day.
                    </p>
                    <a
                        href="mailto:hello@quizgate.io"
                        className="mt-4 inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:underline"
                    >
                        hello@quizgate.io
                        <ArrowRight className="size-4" />
                    </a>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
