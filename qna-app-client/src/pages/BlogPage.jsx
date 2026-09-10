import { Link } from "react-router";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const featured = {
    image: "https://picsum.photos/seed/quizgate-scantron/900/900",
    category: "Assessment design",
    date: "Sep 4, 2026",
    title: "Why Scheduled Access Windows Are the Future of Online Testing",
    description:
        "Open-link quizzes are a liability. When anyone can access an assessment at any time, you lose control over fairness, timing, and integrity. Here's why leading institutions are switching to fixed-window, role-gated assessments — and what that means for your evaluation process.",
    readTime: "6 min read",
};

const posts = [
    {
        image: "https://picsum.photos/seed/quizgate-interview-woman/700/500",
        category: "Hiring",
        date: "Aug 28, 2026",
        title: "How to Build a Technical Screening Process That Actually Predicts Performance",
        description:
            "Most technical screens measure how well candidates Google, not how well they think. We looked at data from 14,000 assessments to find the question types...",
        readTime: "9 min read",
    },
    {
        image: "https://picsum.photos/seed/quizgate-team-laptop/700/500",
        category: "Education",
        date: "Aug 14, 2026",
        title: "The Case Against Unlimited Retakes: What the Data Shows",
        description:
            "Allowing unlimited quiz retakes feels student-friendly, but the numbers tell a different story. After analyzing 40,000 student attempts across 300 institutions, w...",
        readTime: "7 min read",
    },
    {
        image: "https://picsum.photos/seed/quizgate-coders-desk/700/500",
        category: "Product",
        date: "Jul 30, 2026",
        title: "Role-Gated Access Explained: Admins, Students, and Why the Separation Matters",
        description:
            "A single permission model for everyone is how exam content leaks. Quizgate was built with a strict two-role system from day one — here's the architectural...",
        readTime: "5 min read",
    },
    {
        image: "https://picsum.photos/seed/quizgate-home-office/700/500",
        category: "Remote work",
        date: "Jul 15, 2026",
        title: "Assessing Distributed Teams: Lessons from 500 Remote-First Companies",
        description:
            "Remote hiring introduced a new challenge: how do you run a standardized assessment when candidates are in 40 different time zones? We surveyed 500...",
        readTime: "8 min read",
    },
];

function CategoryBadge({ children, className }) {
    return (
        <span
            className={cn(
                "inline-block rounded-md bg-orange-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-orange-700",
                className
            )}
        >
            {children}
        </span>
    );
}

export default function BlogPage() {
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
                    Blog
                </h1>

                <div className="mt-8 grid overflow-hidden rounded-2xl bg-muted sm:grid-cols-2">
                    <img
                        src={featured.image}
                        alt={featured.title}
                        className="h-64 w-full object-cover sm:h-full"
                    />
                    <div className="p-8 sm:p-10">
                        <div className="flex items-center gap-3">
                            <CategoryBadge>{featured.category}</CategoryBadge>
                            <span className="text-sm text-muted-foreground">{featured.date}</span>
                        </div>
                        <h2 className="mt-4 text-3xl font-black tracking-tight">
                            {featured.title}
                        </h2>
                        <p className="mt-4 text-muted-foreground">{featured.description}</p>
                        <div className="mt-6 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="size-4" /> {featured.readTime}
                            </span>
                            <span className="font-semibold text-orange-600">Read article →</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    {posts.map((post) => (
                        <div
                            key={post.title}
                            className="overflow-hidden rounded-2xl bg-muted"
                        >
                            <img
                                src={post.image}
                                alt={post.title}
                                className="h-48 w-full object-cover"
                            />
                            <div className="p-6">
                                <div className="flex items-center gap-3">
                                    <CategoryBadge>{post.category}</CategoryBadge>
                                    <span className="text-sm text-muted-foreground">{post.date}</span>
                                </div>
                                <h3 className="mt-3 text-xl font-bold tracking-tight">
                                    {post.title}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {post.description}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="size-4" /> {post.readTime}
                                    </span>
                                    <span className="font-semibold text-orange-600">Read →</span>
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
