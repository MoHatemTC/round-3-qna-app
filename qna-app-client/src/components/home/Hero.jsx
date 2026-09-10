import { Link } from "react-router";
import { ArrowRight} from "lucide-react";
import ExamPreviewCard from "./ExamPreviewCard";


export default function Hero() {
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