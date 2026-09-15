import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Bell, CheckCheck, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNow } from "@/hooks/useNow"
import { formatDuration } from "@/lib/quizStatus"
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/services"

// Students only: in-app notifications for quiz invitations, shown next to the
// account icon. Polls so a new invite appears while the student is on the site.

const POLL_INTERVAL_MS = 30_000

function timeAgo(iso, now) {
  const ms = now - new Date(iso)
  return ms < 60_000 ? "just now" : `${formatDuration(ms)} ago`
}

function availabilityText(notification, now) {
  if (notification.availability === "upcoming") {
    return `Opens in ${formatDuration(new Date(notification.starts_at) - now)}`
  }
  if (notification.availability === "closed") return "Closed"
  return `Open now · closes in ${formatDuration(new Date(notification.ends_at) - now)}`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const now = useNow()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ unread_count: 0, notifications: [] })
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const panelId = useId()

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications()
      setData({
        unread_count: result?.unread_count ?? 0,
        notifications: Array.isArray(result?.notifications) ? result.notifications : [],
      })
      setError("")
    } catch (err) {
      setError(err.message || "Couldn't load notifications.")
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const timer = setInterval(refresh, POLL_INTERVAL_MS)
    function handleVisible() {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", handleVisible)
    window.addEventListener("focus", refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", handleVisible)
      window.removeEventListener("focus", refresh)
    }
  }, [refresh])

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

  function toggle() {
    if (!open) refresh()
    setOpen((current) => !current)
  }

  async function handleOpenNotification(notification) {
    setOpen(false)
    if (!notification.read) {
      // Optimistic: clear the dot right away, then sync with the server.
      setData((current) => ({
        unread_count: Math.max(0, current.unread_count - 1),
        notifications: current.notifications.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        ),
      }))
      markNotificationRead(notification.id).catch(() => refresh())
    }
    navigate(`/quiz/${notification.quiz_id}/instructions`)
  }

  async function handleMarkAllRead() {
    setData((current) => ({
      unread_count: 0,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }))
    try {
      await markAllNotificationsRead()
    } catch {
      refresh()
    }
  }

  const unread = data.unread_count
  const badgeText = unread > 9 ? "9+" : String(unread)

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          open && "bg-muted"
        )}
      >
        <Bell className={cn("size-5", unread > 0 && "animate-[bell-ring_1s_ease-in-out_1]")} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-bold leading-none text-white ring-2 ring-background"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Announces new invites to screen readers without stealing focus. */}
      <span className="sr-only" aria-live="polite">
        {unread ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}` : ""}
      </span>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">
              Notifications
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                  {unread} new
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
              >
                <CheckCheck className="size-3.5" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</p>}

            {loaded && error && (
              <p role="alert" className="px-4 py-6 text-center text-sm text-destructive">{error}</p>
            )}

            {loaded && !error && data.notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
                <Bell className="size-6" />
                <p>No notifications yet.</p>
                <p className="text-xs">You'll see quiz invitations here.</p>
              </div>
            )}

            {data.notifications.length > 0 && (
              <ul className="divide-y divide-border">
                {data.notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                        !notification.read && "bg-orange-50/60 dark:bg-orange-500/5"
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                        <Mail className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm">
                          You've been invited to{" "}
                          <span className="font-semibold">{notification.quiz_title}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {availabilityText(notification, now)} · {timeAgo(notification.created_at, now)}
                        </span>
                      </span>
                      {!notification.read && (
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-red-600" aria-label="Unread" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
