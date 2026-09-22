"use client";
import { useEffect, useState } from "react";
export function useRemainingSeconds(deadline: number | null, clockOffset = 0) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [deadline]);
  return deadline === null
    ? 0
    : Math.max(0, Math.ceil((deadline - now - clockOffset) / 1000));
}
