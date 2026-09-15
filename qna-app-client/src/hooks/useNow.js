import { useEffect, useState } from "react";

// Re-renders on an interval so time-based UI (Active/Inactive, "opens in 5m",
// countdowns) updates by itself when a quiz window opens or closes.
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return now;
}
