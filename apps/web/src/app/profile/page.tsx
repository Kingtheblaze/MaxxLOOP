"use client";

import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import { Monitor, Moon, Sun } from "lucide-react";

const themes: { id: ThemePreference; label: string; icon: typeof Sun; description: string }[] = [
  { id: "light", label: "Light", icon: Sun, description: "Use the light appearance" },
  { id: "dark", label: "Dark", icon: Moon, description: "Use the dark appearance" },
  { id: "system", label: "System", icon: Monitor, description: "Follow your device appearance" },
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  if (!user) return null;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 pb-12">
      <PageHeader eyebrow="Account" title="Your profile" description="Your MaxxLoop account details." />
      <section className="app-panel p-5 md:p-6" aria-labelledby="appearance-heading">
        <div className="mb-4"><h2 id="appearance-heading" className="text-sm font-semibold text-textPrimary">Appearance</h2><p className="mt-1 text-sm text-textSecondary">Choose how MaxxLoop looks.</p></div>
        <div role="group" aria-label="Choose appearance" className="grid grid-cols-3 gap-2 rounded-xl bg-surfaceHover p-1.5">
          {themes.map(({ id, label, icon: Icon, description }) => <button key={id} type="button" aria-label={description} aria-pressed={preference === id} onClick={() => setPreference(id)} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors ${preference === id ? "bg-surface text-accent shadow-sm ring-1 ring-border" : "text-textSecondary hover:bg-surface/70 hover:text-textPrimary"}`}><Icon aria-hidden="true" className="h-4 w-4" />{label}</button>)}
        </div>
        <p className="mt-3 text-xs text-textMuted" aria-live="polite">{preference === "system" ? "Following your device appearance." : `${preference === "light" ? "Light" : "Dark"} appearance selected.`}</p>
      </section>
      <section aria-label="Profile details" className="app-panel divide-y divide-border/70 p-5 md:p-6">
        <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[180px_1fr]"><span className="text-sm text-textSecondary">Name</span><span className="text-sm font-medium text-textPrimary">{user.name}</span></div>
        <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]"><span className="text-sm text-textSecondary">Email</span><span className="break-all text-sm font-medium text-textPrimary">{user.email}</span></div>
        <div className="grid gap-1 py-4 last:pb-0 sm:grid-cols-[180px_1fr]"><span className="text-sm text-textSecondary">Account created</span><time className="text-sm font-medium text-textPrimary" dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time></div>
      </section>
      <section className="app-panel flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div><h2 className="text-sm font-semibold text-textPrimary">Sign out</h2><p className="mt-1 text-sm text-textSecondary">End this session on this device.</p></div>
        <button type="button" onClick={() => void signOut()} className="app-button-secondary">Sign out</button>
      </section>
    </main>
  );
}
