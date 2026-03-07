/** Application mode detection — sandbox vs demo vs production. */

const _href = typeof window !== "undefined" ? (window.location.href ?? "") : "";
const urlParams =
  typeof window !== "undefined" && window.location.search
    ? new URLSearchParams(window.location.search)
    : null;
const _env: Record<string, string | undefined> =
  (typeof import.meta !== "undefined" && import.meta.env) || {};

export const isDemoMode =
  urlParams?.get("demo") === "true" ||
  _href.includes("demo=true") ||
  _env.VITE_DEMO_MODE === "true";

export const isSandboxMode =
  urlParams?.get("sandbox") === "true" ||
  _href.includes("sandbox=true") ||
  _env.VITE_SANDBOX_MODE === "true" ||
  _href.includes("bikinibottom.ai");
