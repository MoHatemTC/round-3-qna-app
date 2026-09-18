import { FilePen, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

// Draft vs published, shown as an icon + word so it never relies on colour.
export default function PublishStateBadge({ status, className }) {
  const published = status === "published"
  const Icon = published ? Globe : FilePen

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        published
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          : "bg-muted text-muted-foreground ring-1 ring-border",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {published ? "Published" : "Draft"}
    </span>
  )
}
