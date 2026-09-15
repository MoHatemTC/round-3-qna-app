import { Navigate, Outlet, useLocation } from "react-router"
import { dashboardPathFor, useSession } from "@/context/session"

function SessionCheck() {
    return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
            Checking your session...
        </div>
    )
}

export function Proxy() {
    const location = useLocation()
    const { user, loading } = useSession()

    if (loading) return <SessionCheck />
    if (!user) return <Navigate to="/login" replace />

    if (user.role === "admin" && !location.pathname.startsWith("/admin-panel")) {
        return <Navigate to="/admin-panel" replace />
    }

    const studentAllowedPaths = ["/dashboard", "/quiz"]
    if (user.role === "student" && !studentAllowedPaths.some((p) => location.pathname.startsWith(p))) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}

export function PublicRoute() {
    const { user, loading } = useSession()

    if (loading) return <SessionCheck />
    if (user) return <Navigate to={dashboardPathFor(user)} replace />

    return <Outlet />
}
