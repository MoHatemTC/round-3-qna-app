import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router"

export function Proxy() {
    const location = useLocation()
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true

        fetch("http://localhost:3000/auth/session", { credentials: "include" })
            .then((response) => {
                if (!response.ok) throw new Error("Unauthenticated")
                return response.json()
            })
            .then((data) => {
                if (active) setSession(data.user)
            })
            .catch(() => {
                if (active) setSession(false)
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    if (loading) return null
    if (!session) return <Navigate to="/login" replace />

    const role = session.role

    if (role === "admin" && location.pathname !== "/admin-panel") {
        return <Navigate to={'/admin-panel'} replace />
    }

    if (role === "student" && location.pathname !== "/dashboard") {
        return <Navigate to={'/dashboard'} replace />
    }

    return <Outlet />
}

export function PublicRoute() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true

        fetch("http://localhost:3000/auth/session", { credentials: "include" })
            .then((response) => {
                if (!response.ok) throw new Error("Unauthenticated")
                return response.json()
            })
            .then((data) => {
                if (active) setSession(data.user)
            })
            .catch(() => {
                if (active) setSession(false)
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => { active = false }
    }, [])

    if (loading) return null

    if (session) {
        const targetPath = session.role === "admin" ? "/admin-panel" : "/dashboard"
        return <Navigate to={targetPath} replace />
    }

    return <Outlet />
}