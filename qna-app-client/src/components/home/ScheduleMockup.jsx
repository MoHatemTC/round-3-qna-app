import { Clock } from "lucide-react";

export default function ScheduleMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4 text-orange-600" />
                Access window
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm text-muted-foreground">Before window</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        Locked
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-orange-200">
                    <span className="text-sm font-medium">During window</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Live
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 ring-1 ring-border">
                    <span className="text-sm text-muted-foreground">After window</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        Closed
                    </span>
                </div>
            </div>
        </div>
    );
}