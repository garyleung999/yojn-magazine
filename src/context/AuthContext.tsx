"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/* ========================================
   Auth Types
======================================== */

export type AuthProviderType = "google" | "line";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: AuthProviderType | "email";
  /** Anonymous display name like "讀者 #8492" */
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}


/* ========================================
   Helpers
======================================== */

/** Generate a stable anonymous display name from user id */
function generateDisplayName(id: string): string {
  // Take first 8 chars of user id and create a numeric hash
  const hash = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const shortId = (hash % 9000) + 1000;
  return `讀者 #${shortId}`;
}

function mapSupabaseUser(sbUser: User): AuthUser {
  const identities = sbUser.identities ?? [];
  const provider = identities.length > 0
    ? (identities[0].provider as AuthProviderType | "email")
    : "email";

  return {
    id: sbUser.id,
    email: sbUser.email ?? null,
    name: sbUser.user_metadata?.full_name ?? sbUser.user_metadata?.name ?? null,
    avatar_url: sbUser.user_metadata?.avatar_url ?? null,
    provider,
    displayName: generateDisplayName(sbUser.id),
  };
}

/**
 * Strip auth-related query parameters and hash from the current URL.
 * This prevents Supabase's GoTrueClient from picking up stale tokens
 * (e.g. expired access_token, refresh_token) that may remain in the URL
 * after an OAuth redirect or a shared link.
 */
function stripAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const authParams = [
    "access_token",
    "refresh_token",
    "expires_in",
    "expires_at",
    "token_type",
    "type",
    "provider_token",
    "error",
    "error_description",
  ];

  let changed = false;

  // Remove auth params from search (query string)
  for (const param of authParams) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  // Remove hash fragment if it contains auth tokens
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace("#", "?"));
    const hasAuthInHash = authParams.some((p) => hashParams.has(p));
    if (hasAuthInHash) {
      url.hash = "";
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, "", url.toString());
  }
}

/* ========================================
   Context
======================================== */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ========================================
   Provider
======================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Start with isLoading=false so the app never blocks on auth initialization.
  // Auth is a nice-to-have enhancement, not a render dependency.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track the safety timeout for cleanup
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize auth state from Supabase session
  useEffect(() => {
    async function initAuth() {
      // ── Step 1: Force handle hash token (priority over any old session) ──
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const expires_at = params.get('expires_at');

        if (access_token && refresh_token && expires_at) {
          // Set new session (overrides old cookies)
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!error) {
            // Directly fetch user and update state
            const { data: { user: newUser } } = await supabase.auth.getUser();
            setUser(newUser ? mapSupabaseUser(newUser) : null);
            setIsLoading(false);
            // Clean URL hash to prevent reusing expired tokens on next refresh
            window.history.replaceState(null, '', window.location.pathname);
            return; // Skip subsequent getSession and onAuthStateChange init
          }
        }
      }

      // ── Step 2: Strip stale auth params from URL ──
      stripAuthParamsFromUrl();

      // ── Step 3: Safety timeout ──
      // Force loading to end after 5 seconds to prevent the app from
      // being permanently stuck if auth hangs (e.g. network issue, 403).
      safetyTimeoutRef.current = setTimeout(() => {
        setIsLoading((prev) => {
          if (prev) {
            console.warn("Auth init timed out after 5s — forcing loading to end");
            setError("身份驗證服務初始化逾時，部分功能可能受限。");
            return false;
          }
          return prev;
        });
      }, 5000);

      // ── Step 4: Normal session recovery (no hash token) ──
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(mapSupabaseUser(data.session.user));
        }
      } catch (err) {
        console.error("Failed to get Supabase session:", err);
        // Strip URL params again in case the error was caused by stale tokens
        stripAuthParamsFromUrl();
        setUser(null);
        setError("登入資訊已失效，請重新登入。");
      } finally {
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        setIsLoading(false);
      }

      // ── Step 5: Listen for auth state changes ──
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
      });

      return () => {
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        subscription.unsubscribe();
      };
    }

    initAuth();
  }, []);




  const loginWithProvider = useCallback(async (provider: AuthProviderType) => {
    setIsLoading(true);
    try {
      // Use `as any` because Supabase's Provider type doesn't include "line"
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : "/",
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("OAuth login error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } catch (err) {
        console.error("Email login error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        error,
        loginWithProvider,
        loginWithEmail,
        logout,
      }}

    >
      {children}
    </AuthContext.Provider>
  );
}

/* ========================================
   Hook
======================================== */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
