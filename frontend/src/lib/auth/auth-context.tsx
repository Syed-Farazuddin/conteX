"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  apiRequest,
  API_BASE,
  ApiError,
  type AuthTokens,
  type AuthUser,
} from "../api/client";

interface SignupInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  // Authenticated fetch — attaches the access token and transparently refreshes
  // it once on a 401.
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = useRef<string | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = await apiRequest<AuthTokens>("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({}),
      });
      accessToken.current = tokens.accessToken;
      return true;
    } catch {
      accessToken.current = null;
      return false;
    }
  }, []);

  const loadUser = useCallback(async () => {
    const me = await apiRequest<AuthUser>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken.current}` },
    });
    setUser(me);
  }, []);

  // Restore the session on first load using the httpOnly refresh cookie.
  useEffect(() => {
    (async () => {
      if (await refresh()) {
        try {
          await loadUser();
        } catch {
          accessToken.current = null;
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, [refresh, loadUser]);

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const withAuth = (token: string | null): RequestInit => ({
        ...init,
        credentials: "include",
        headers: {
          ...(init.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      try {
        return await apiRequest<T>(path, withAuth(accessToken.current));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (await refresh()) {
            return apiRequest<T>(path, withAuth(accessToken.current));
          }
          setUser(null);
        }
        throw err;
      }
    },
    [refresh],
  );

  const finishAuth = useCallback(
    async (tokens: AuthTokens) => {
      accessToken.current = tokens.accessToken;
      await loadUser();
    },
    [loadUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiRequest<AuthTokens>("/api/auth/login", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      await finishAuth(tokens);
    },
    [finishAuth],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const tokens = await apiRequest<AuthTokens>("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
      });
      await finishAuth(tokens);
    },
    [finishAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({}),
      });
    } catch {
      // ignore network errors on logout
    }
    accessToken.current = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { API_BASE };
