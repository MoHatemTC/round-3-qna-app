import { Lock } from "lucide-react";

export default function GateMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4 text-orange-600" />
                Role check
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">admin@board.edu</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Allowed
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">student@board.edu</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Invited
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm font-medium">unknown@web.io</span>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        Denied
                    </span>
                </div>
            </div>
        </div>
    );
}