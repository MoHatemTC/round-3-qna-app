import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Link } from "react-router";

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

export default function Pricing() {
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