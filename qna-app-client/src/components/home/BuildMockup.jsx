export default function BuildMockup() {
    return (
        <div className="rounded-2xl bg-muted p-6 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="text-sm font-semibold">New Quiz</p>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    DRAFT
                </span>
            </div>

            <div className="mt-4 space-y-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Title
                    </p>
                    <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                        Mid-term — Section B
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Opens
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            Oct 03, 14:00
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Closes
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            Oct 03, 16:00
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Duration
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            90 min
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Questions
                        </p>
                        <div className="mt-1 rounded-lg bg-background px-3 py-2 text-sm font-medium ring-1 ring-border">
                            32 added
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                    Publish quiz →
                </button>
            </div>
        </div>
    );
}