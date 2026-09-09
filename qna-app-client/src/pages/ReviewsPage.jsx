import { Link } from "react-router";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const breakdown = [
    { stars: 5, percent: 83 },
    { stars: 4, percent: 17 },
    { stars: 3, percent: 0 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
];

const reviews = [
    {
        rating: 5,
        quote:
            "We switched from Google Forms and the difference is night and day. The access scheduling alone saved us hours of manual enforcement every exam cycle.",
        name: "Sarah M.",
        role: "Head of Talent · Fintech Co.",
        initial: "S",
        color: "bg-violet-500",
    },
    {
        rating: 5,
        quote:
            "My students can't access the quiz early no matter what they try. That's exactly what I needed. Setup took less than 10 minutes.",
        name: "James O.",
        role: "Instructor · State University",
        initial: "J",
        color: "bg-teal-500",
    },
    {
        rating: 5,
        quote:
            "The role separation is clean. Admins see everything, students see only what they're supposed to. No confusion, no accidental leaks.",
        name: "Priya K.",
        role: "L&D Manager · SaaS Startup",
        initial: "P",
        color: "bg-orange-500",
    },
    {
        rating: 4,
        quote:
            "Great for screening candidates. The scheduled window means everyone gets the same conditions. Would love a video proctoring add-on in the future.",
        name: "Marcus T.",
        role: "Technical Recruiter · Hiring Agency",
        initial: "M",
        color: "bg-green-500",
    },
    {
        rating: 5,
        quote:
            "The countdown timer on the student side is a nice touch — keeps them aware without me having to send reminder emails.",
        name: "Leila A.",
        role: "Professor · Engineering Dept.",
        initial: "L",
        color: "bg-rose-500",
    },
    {
        rating: 5,
        quote:
            "Exactly what a placement exam tool should be. Simple, enforced, and doesn't try to do too much. We run 4 cohorts a year and it handles all of them.",
        name: "Dan R.",
        role: "CEO · Bootcamp",
        initial: "D",
        color: "bg-blue-500",
    },
];

function StarRow({ rating, size = "size-4" }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        size,
                        i < rating ? "fill-orange-500 text-orange-500" : "text-border"
                    )}
                />
            ))}
        </div>
    );
}

export default function ReviewsPage() {
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
                    Customer reviews
                </h1>

                <div className="mt-8 flex flex-col divide-y divide-border rounded-2xl bg-muted sm:flex-row sm:divide-x sm:divide-y-0">
                    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
                        <p className="text-5xl font-black">4.8</p>
                        <StarRow rating={5} size="size-5" />
                        <p className="text-sm text-muted-foreground">out of 5</p>
                    </div>

                    <div className="flex-1 space-y-2 p-10">
                        {breakdown.map((row) => (
                            <div key={row.stars} className="flex items-center gap-3">
                                <span className="w-6 shrink-0 text-sm text-muted-foreground">
                                    {row.stars}★
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                                    <div
                                        className="h-full rounded-full bg-orange-500"
                                        style={{ width: `${row.percent}%` }}
                                    />
                                </div>
                                <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                                    {row.percent}%
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1 p-10 text-center">
                        <p className="text-4xl font-black">6+</p>
                        <p className="text-sm text-muted-foreground">verified reviews</p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {reviews.map((review) => (
                        <div key={review.name} className="rounded-2xl bg-muted p-8">
                            <StarRow rating={review.rating} />
                            <p className="mt-4 text-foreground">"{review.quote}"</p>
                            <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                                <span
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                                        review.color
                                    )}
                                >
                                    {review.initial}
                                </span>
                                <div>
                                    <p className="font-semibold">{review.name}</p>
                                    <p className="text-sm text-muted-foreground">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
