import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function FinalCta() {
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