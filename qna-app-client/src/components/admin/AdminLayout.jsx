import { Link, NavLink, Outlet } from "react-router"
import { ClipboardList, House, LayoutDashboard, LifeBuoy, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import AccountMenu from "@/components/AccountMenu"

// CMS shell for everything under /admin-panel: brand + category sidebar on
// desktop, a scrollable category strip on small screens.

const navItems = [
  { to: "/", label: "Home", icon: House, description: "Back to the website" },
  { to: "/admin-panel", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin-panel/quizzes", label: "Quizzes", icon: ClipboardList },
  { to: "/admin-panel/attempts", label: "Attempts & results", icon: ListChecks },
]

function navClass({ isActive }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        Q
      </span>
      <span className="font-heading text-lg font-black tracking-tight">Quizgate</span>
    </Link>
  )
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/40 text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border bg-background lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-16 items-center px-6">
          <Brand />
        </div>

        <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admin CMS
          </p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <NavLink to="/resources/help-center" className={navClass}>
            <LifeBuoy className="size-4" />
            Help center
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
            <div className="lg:hidden">
              <Brand />
            </div>
            <p className="hidden text-sm font-semibold uppercase tracking-wide text-orange-600 lg:block">
              Admin panel
            </p>
            <AccountMenu />
          </div>
          <nav
            aria-label="Admin"
            className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={(state) => cn(navClass(state), "shrink-0 py-1.5")}
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-3xl font-black tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function AdminCard({ className, children }) {
  return (
    <div className={cn("rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10", className)}>
      {children}
    </div>
  )
}

export const adminPrimaryButton =
  "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50 [&_svg]:size-4"

export const adminSecondaryButton =
  "inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-muted disabled:opacity-50 [&_svg]:size-4"

export const adminInput =
  "mt-1.5 w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
