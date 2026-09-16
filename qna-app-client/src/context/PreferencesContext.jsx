import { useEffect, useState } from "react"
import { PreferencesContext } from "./preferences"

// Display & accessibility preferences, stored per browser and applied to <html>.

const STORAGE_KEY = "quizgate:preferences"

const defaults = {
  theme: "light", // "light" | "dark" | "system"
  textSize: "default", // "small" | "default" | "large"
  reduceMotion: false,
  highContrast: false,
}

const textSizes = { small: "14px", default: "16px", large: "18px" }

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStored)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    function apply() {
      const dark = preferences.theme === "dark" || (preferences.theme === "system" && media.matches)
      root.classList.toggle("dark", dark)
      root.style.colorScheme = dark ? "dark" : "light"
    }

    apply()
    root.style.fontSize = textSizes[preferences.textSize] ?? textSizes.default
    root.toggleAttribute("data-reduce-motion", preferences.reduceMotion)
    root.toggleAttribute("data-high-contrast", preferences.highContrast)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Storage can be blocked (private mode) - preferences still apply for this visit.
    }

    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [preferences])

  function updatePreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  )
}
