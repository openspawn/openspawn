import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
import { isDemoMode, isSandboxMode } from "../lib/mode";
import { getSandboxUrl } from "../lib/sandbox-url";

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Demo/sandbox: use sandbox server's /api path
  if (isDemoMode || isSandboxMode) return `${getSandboxUrl()}/api`;

  // Production: API is at /api on same origin (Caddy routes to FastAPI)
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (!port || port === "443" || port === "80") return "/api";
    // Dev: assume FastAPI on port 8000
    return `${protocol}//${hostname}:8000`;
  }

  return "http://localhost:8000";
}

export const api = createClient<paths>({
  baseUrl: getApiBaseUrl(),
});
