import { useEffect } from "react";

const BASE = "BikiniBottom";

export function useTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${BASE}` : `${BASE} — The control plane your AI agents deserve`;
  }, [page]);
}
