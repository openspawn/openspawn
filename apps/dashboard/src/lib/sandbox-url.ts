/** Sandbox API base URL — auto-detects hostname for LAN access */
export function getSandboxUrl(): string {
  if (import.meta.env.VITE_SANDBOX_URL) return import.meta.env.VITE_SANDBOX_URL;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3333`;
  }
  return 'http://localhost:3333';
}

export const SANDBOX_URL = getSandboxUrl();
