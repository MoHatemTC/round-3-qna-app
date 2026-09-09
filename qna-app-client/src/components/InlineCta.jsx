import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export default function InlineCta({ title, subtitle }) {
    return (
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary p-10 text-primary-foreground sm:flex-row sm:items-center">
            <div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
                <p className="mt-2 text-primary-foreground/70">{subtitle}</p>
            </div>
            <Link
                to="/register"
                className="flex shrink-0 items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
                Start free
                <ArrowRight className="size-4" />
            </Link>
        </div>
    );
}
