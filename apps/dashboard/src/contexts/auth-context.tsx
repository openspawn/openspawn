import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
  orgId: string;
  totpEnabled: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<{ requiresTwoFactor?: boolean }>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "openspawn_auth";
const REFRESH_THRESHOLD_MS = 60 * 1000; // Refresh 1 minute before expiry

function getApiUrl(): string {
  // Use the same host as the dashboard, but different port for API
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `http://${host}:3000`;
  }
  return "http://localhost:3000";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = getApiUrl();

  // Load tokens from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthTokens;
        if (parsed.expiresAt > Date.now()) {
          setTokens(parsed);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch user info when tokens change
  useEffect(() => {
    if (!tokens) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token might be invalid, try to refresh
          const refreshed = await refreshSession();
          if (!refreshed) {
            setTokens(null);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        }
      } catch {
        // Network error, keep existing state
      }
    };

    fetchUser();
  }, [tokens?.accessToken]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!tokens) return;

    const timeUntilExpiry = tokens.expiresAt - Date.now();
    const timeUntilRefresh = timeUntilExpiry - REFRESH_THRESHOLD_MS;

    if (timeUntilRefresh <= 0) {
      refreshSession();
      return;
    }

    const timeout = setTimeout(() => {
      refreshSession();
    }, timeUntilRefresh);

    return () => clearTimeout(timeout);
  }, [tokens?.expiresAt]);

  const saveTokens = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
    const newTokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    setTokens(newTokens);
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    totpCode?: string,
  ): Promise<{ requiresTwoFactor?: boolean }> => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    setUser(data.user);

    return {};
  }, [apiUrl, saveTokens]);

  const loginWithGoogle = useCallback(() => {
    // Redirect to Google OAuth
    window.location.href = `${apiUrl}/auth/google`;
  }, [apiUrl]);

  const logout = useCallback(async () => {
    if (tokens?.refreshToken) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {
        // Ignore errors, we're logging out anyway
      }
    }

    setTokens(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, [apiUrl, tokens]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
      return true;
    } catch {
      return false;
    }
  }, [apiUrl, tokens?.refreshToken, saveTokens]);

  const getAccessToken = useCallback((): string | null => {
    return tokens?.accessToken ?? null;
  }, [tokens?.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        logout,
        refreshSession,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Handle OAuth callback
export function useOAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const expiresIn = params.get("expiresIn");

    if (accessToken && refreshToken && expiresIn) {
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + parseInt(expiresIn, 10) * 1000,
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

      // Redirect to dashboard
      window.location.href = "/";
    }
  }, []);
}
