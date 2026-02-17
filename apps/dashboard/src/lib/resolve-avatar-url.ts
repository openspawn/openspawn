/**
 * Resolve an avatar URL against the sandbox API server.
 * In dev, Vite runs on a different port than the sandbox API, so relative
 * avatar paths (like /avatars/spongebob.png) need the API origin prepended.
 * In production (same-origin), SANDBOX_URL is empty so paths stay relative.
 */
import { SANDBOX_URL } from './sandbox-url';

export function resolveAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SANDBOX_URL}${url}`;
}
