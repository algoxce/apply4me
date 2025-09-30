import { useEffect } from "react";

export default function useBackendWarmth() {
  useEffect(() => {
    // Call /health (proxied by Vercel to backend /health)
    fetch("/health").catch(() => {});
  }, []);
}
