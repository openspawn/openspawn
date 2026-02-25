import { useEffect } from "react";

const BASE = "OpenSpawn";

export function useTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${BASE}` : `${BASE} — AI agents that touch the real world`;
  }, [page]);
}
