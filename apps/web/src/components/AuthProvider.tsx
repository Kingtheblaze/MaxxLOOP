"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const PRIVATE_ROUTES = ["/dashboard", "/demo", "/insights", "/onboarding", "/history", "/profile"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const result = await api.getCurrentUser();
      setUser(result.user as AuthUser);
      return result.user as AuthUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const isPrivate = PRIVATE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  useEffect(() => {
    if (!loading && isPrivate && !user && !signingOut.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    if (pathname === "/" && signingOut.current) signingOut.current = false;
  }, [isPrivate, loading, pathname, router, user]);

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
      signingOut.current = true;
      setUser(null);
      router.replace("/");
    } catch {
      // Keep the current session visible when the server cannot revoke it.
    }
  }, [router]);

  const value = useMemo(() => ({ user, loading, refreshUser, signOut }), [user, loading, refreshUser, signOut]);
  const waitingForRouteAuth = isPrivate && (loading || !user);

  return (
    <AuthContext.Provider value={value}>
      {waitingForRouteAuth ? (
        <main className="flex min-h-[60vh] items-center justify-center px-6 text-sm text-textSecondary" aria-live="polite">
          {loading ? "Checking your session…" : "Taking you to sign in…"}
        </main>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
