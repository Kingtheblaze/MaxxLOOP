"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { AuthLayout } from "@/components/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.signIn({ email: email.trim(), password });
      await refreshUser();
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <main id="main-content" tabIndex={-1} className="w-full">
        <section className="w-full space-y-7">
          <header className="space-y-3">
            <p className="app-eyebrow">Welcome back</p>
            <h1 className="text-3xl font-semibold tracking-tight text-textPrimary">Sign in to MaxxLoop</h1>
            <p className="text-sm leading-6 text-textSecondary">Continue to your personal focus and recovery workspace.</p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="app-label" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="app-field mt-2" placeholder="you@example.com" /></label>
            <label className="app-label" htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="app-field mt-2" placeholder="Enter your password" /></label>
            {error && <p role="alert" className="app-status-error">{error}</p>}
            <button className="app-button-primary w-full" type="submit" disabled={submitting} aria-busy={submitting}><LockKeyhole aria-hidden="true" className="h-4 w-4" />{submitting ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="border-t border-border pt-5 text-sm text-textSecondary">New to MaxxLoop? <Link href="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">Create account <span aria-hidden="true">→</span></Link></p>
        </section>
      </main>
    </AuthLayout>
  );
}
