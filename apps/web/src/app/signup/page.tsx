"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { AuthLayout } from "@/components/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await api.signUp({ name: name.trim(), email: email.trim(), password });
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your account could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <main id="main-content" tabIndex={-1} className="w-full">
        <section className="w-full space-y-6">
          <header className="space-y-3">
            <p className="app-eyebrow">Your personal workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-textPrimary">Create your account</h1>
            <p className="text-sm leading-6 text-textSecondary">A private space to learn what supports your focus and recovery.</p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="app-label" htmlFor="name">Name<input id="name" name="name" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="app-field mt-1.5" placeholder="Your name" /></label>
            <label className="app-label" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="app-field mt-1.5" placeholder="you@example.com" /></label>
            <label className="app-label" htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="app-field mt-1.5" placeholder="At least 8 characters" /></label>
            <label className="app-label" htmlFor="confirm-password">Confirm password<input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="app-field mt-1.5" placeholder="Enter your password again" /></label>
            {error && <p role="alert" className="app-status-error">{error}</p>}
            <button className="app-button-primary w-full" type="submit" disabled={submitting} aria-busy={submitting}><UserPlus aria-hidden="true" className="h-4 w-4" />{submitting ? "Creating account…" : "Create account"}</button>
          </form>
          <p className="border-t border-border pt-4 text-sm text-textSecondary">Already have an account? <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Sign in <span aria-hidden="true">→</span></Link></p>
        </section>
      </main>
    </AuthLayout>
  );
}
