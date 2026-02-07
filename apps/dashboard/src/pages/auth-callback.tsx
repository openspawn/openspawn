import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useOAuthCallback } from "../contexts";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback
  useOAuthCallback();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      // Redirect to login with error
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // If no tokens in URL, check if we were redirected after storage
    const hasTokens =
      searchParams.get("accessToken") &&
      searchParams.get("refreshToken") &&
      searchParams.get("expiresIn");

    if (!hasTokens) {
      // OAuth callback should have redirected us, go to home
      navigate("/");
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
