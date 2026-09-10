import { useState } from "react";
import { Link } from "react-router";
import {
    ChevronDown,
    ClipboardCheck,
    LifeBuoy,
    Newspaper,
    Radio,
    Sparkles,
    Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const featuresMenu = [
    {
        icon: ClipboardCheck,
        title: "Assessments",
        description: "Auto-graded skills tests & screening",
        href: "/features/assessments",
    },
    {
        icon: Radio,
        title: "Interviews",
        description: "Live & async technical interviews",
        href: "/features/interviews",
    },
];

const resourcesMenu = [
    {
        icon: Sparkles,
        title: "What's new",
        description: "Latest updates & releases",
        href: "/resources/whats-new",
    },
    {
        icon: LifeBuoy,
        title: "Help center",
        description: "Guides, FAQs, and support",
        href: "/resources/help-center",
    },
    {
        icon: Newspaper,
        title: "Blog",
        description: "Insights on assessments & hiring",
        href: "/resources/blog",
    },
    {
        icon: Star,
        title: "Customer reviews",
        description: "What our users say",
        href: "/resources/reviews",
    },
];

function NavDropdownItem({ item, onNavigate }) {
    const content = (
        <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <item.icon className="size-4" />
            </span>
            <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
        </>
    );

    if (item.href) {
        return (
            <Link
                to={item.href}
                onClick={onNavigate}
                className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors"
            >
                {content}
            </Link>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors cursor-default">
            {content}
        </div>
    );
}

function NavDropdown({ label, items }) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                {label}
                <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3">
                    <div className="rounded-xl bg-card p-2 shadow-lg ring-1 ring-foreground/10">
                        {items.map((item) => (
                            <NavDropdownItem key={item.title} item={item} onNavigate={() => setOpen(false)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                        Q
                    </span>
                    <span className="font-heading text-lg font-black tracking-tight">Quizgate</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <NavDropdown label="Features" items={featuresMenu} />
                    <NavDropdown label="Resources" items={resourcesMenu} />
                    <a
                        href="/#how-it-works"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        How it works
                    </a>
                    <a
                        href="/#pricing"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Pricing
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/register"
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors"
                    >
                        Start free
                    </Link>
                </div>
            </div>
        </header>
    );
}
