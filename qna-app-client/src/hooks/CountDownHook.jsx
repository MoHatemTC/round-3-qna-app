import { useEffect, useMemo, useState } from "react";

export function useCountdown(seedSeconds) {
    const [remaining, setRemaining] = useState(seedSeconds);

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((s) => (s > 0 ? s - 1 : seedSeconds));
        }, 1000);
        return () => clearInterval(id);
    }, [seedSeconds]);

    return useMemo(() => {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    }, [remaining]);
}