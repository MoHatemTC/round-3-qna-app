import { useEffect, useId, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Accessibility,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { dashboardPathFor, useSession } from "@/context/session"
import { usePreferences } from "@/context/preferences"

function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function MenuItem({ icon: Icon, children, trailing, className, to, ...props }) {
  const classes = cn(
    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
    className
  )
  const content = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 font-medium">{children}</span>
      {trailing}
    </>
  )

  if (to) {
    return (
      <Link role="menuitem" to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button role="menuitem" type="button" className={classes} {...props}>
      {content}
    </button>
  )
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </legend>
      <div
        className="grid gap-1 rounded-lg bg-muted p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              value === option.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon && <option.icon className="size-3.5" />}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-orange-600" : "bg-foreground/20"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  )
}

function DisplayPanel({ onBack }) {
  const { preferences, updatePreference } = usePreferences()

  return (
    <div className="space-y-4 p-1.5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-orange-600"
      >
        <ChevronLeft className="size-4" /> Display & accessibility
      </button>

      <SegmentedControl
        label="Theme"
        value={preferences.theme}
        onChange={(value) => updatePreference("theme", value)}
        options={[
          { value: "light", label: "Light", icon: Sun },
          { value: "dark", label: "Dark", icon: Moon },
          { value: "system", label: "System", icon: Monitor },
        ]}
      />

      <SegmentedControl
        label="Text size"
        value={preferences.textSize}
        onChange={(value) => updatePreference("textSize", value)}
        options={[
          { value: "small", label: "A−", ariaLabel: "Small text" },
          { value: "default", label: "A", ariaLabel: "Default text" },
          { value: "large", label: "A+", ariaLabel: "Large text" },
        ]}
      />

      <div className="space-y-3 border-t border-border pt-3">
        <ToggleRow
          label="Reduce motion"
          description="Turn off animations and transitions"
          checked={preferences.reduceMotion}
          onChange={(value) => updatePreference("reduceMotion", value)}
        />
        <ToggleRow
          label="High contrast"
          description="Stronger text and borders"
          checked={preferences.highContrast}
          onChange={(value) => updatePreference("highContrast", value)}
        />
      </div>
    </div>
  )
}

export default function AccountMenu() {
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState("main")
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  if (!user) return null

  function toggle() {
    setPanel("main")
    setOpen((current) => !current)
  }

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate("/login", { replace: true })
  }

  const initials = initialsOf(user.name)

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        title={user.name}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          open && "ring-2 ring-orange-500"
        )}
      >
        <UserRound className="size-4.5" />
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 ring-2 ring-background"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          {panel === "main" ? (
            <>
              <div className="flex items-center gap-3 rounded-lg p-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials || <UserRound className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="my-1 border-t border-border" />

              <MenuItem icon={LayoutDashboard} to={dashboardPathFor(user)} onClick={() => setOpen(false)}>
                Dashboard
              </MenuItem>
              <MenuItem
                icon={Accessibility}
                onClick={() => setPanel("display")}
                trailing={<ChevronRight className="size-4 text-muted-foreground" />}
              >
                Display & accessibility
              </MenuItem>

              <div className="my-1 border-t border-border" />

              <MenuItem icon={LogOut} onClick={handleSignOut}>
                Log out
              </MenuItem>
            </>
          ) : (
            <DisplayPanel onBack={() => setPanel("main")} />
          )}
        </div>
      )}
    </div>
  )
}
