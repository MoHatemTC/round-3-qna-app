import SiteHeader from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

// Shared shell for the sign-in, register and verify-account screens so all
// three stay visually identical.

export const authInputClass =
    "mt-1.5 w-full rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring";

export const authButtonClass =
    "mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors disabled:opacity-50";

export function AuthMessage({ tone = "error", children }) {
    if (!children) return null;
    return (
        <p
            role={tone === "error" ? "alert" : "status"}
            className={cn(
                "mt-4 text-sm",
                tone === "error" ? "text-destructive" : "text-green-700 dark:text-green-400"
            )}
        >
            {children}
        </p>
    );
}

export default function AuthCard({ icon: Icon, title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 px-6 py-12">
                <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl ring-1 ring-foreground/10">
                    {Icon && (
                        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                            <Icon className="size-6" />
                        </span>
                    )}
                    <h2 className="text-2xl font-bold text-center">{title}</h2>
                    {subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground text-center">{subtitle}</p>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
