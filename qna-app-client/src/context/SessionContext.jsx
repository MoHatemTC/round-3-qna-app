import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { logout } from "@/services/services"
import { SessionContext } from "./session"

// Single source of truth for "who is signed in". Route guards, the site header
// and the admin layout all read from here instead of fetching /auth/session
// on their own.

export function SessionProvider({ children }) {
  // undefined = still checking, null = signed out, object = signed-in user
  const [user, setUser] = useState(undefined)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get("/auth/session")
      setUser(data?.user ?? null)
      return data?.user ?? null
    } catch {
      setUser(null)
      return null
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // The cookie may already be gone - treat the user as signed out regardless.
    }
    setUser(null)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  return (
    <SessionContext.Provider value={{ user, loading: user === undefined, refresh, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}
