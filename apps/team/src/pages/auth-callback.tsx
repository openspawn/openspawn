import { useOAuthCallback } from "../contexts";

export function AuthCallbackPage() {
  // useOAuthCallback handles the OAuth redirect internally via useEffect
  useOAuthCallback();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center space-y-2">
        <span className="text-2xl">⚡</span>
        <p className="text-sm text-white/40">Completing sign-in...</p>
      </div>
    </div>
  );
}
