// frontend/src/hooks/useBackendWarmth.js
import { useEffect } from "react";

/** Pings /api/health once on mount to wake Render free dyno. */
export default function useBackendWarmth() {
  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);
}
