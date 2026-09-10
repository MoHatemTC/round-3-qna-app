const footerColumns = [
    {
        title: "Product",
        links: ["How it works", "Pricing", "Changelog", "Roadmap"],
    },
    {
        title: "Resources",
        links: ["Documentation", "API reference", "Help center", "Status"],
    },
    {
        title: "Legal",
        links: ["Terms of service", "Privacy policy", "Cookie policy", "Security"],
    },
];

export default function SiteFooter() {
    return (
        <footer className="border-t border-border py-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                            <span aria-hidden="true">✉️</span> hello@quizgate.io
                        </p>
                        <p className="flex items-center gap-2">
                            <span aria-hidden="true">📍</span> San Francisco, CA
                        </p>
                        <p className="flex items-center gap-2">
                            <span aria-hidden="true">🕐</span> Mon–Fri, 9am–6pm PST
                        </p>
                    </div>

                    {footerColumns.map((col) => (
                        <div key={col.title}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {col.title}
                            </p>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((link) => (
                                    <li
                                        key={link}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default"
                                    >
                                        {link}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Quizgate. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
