"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, ChevronDown, Clock3, Home, Menu, PlayCircle, Search, Settings2, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const workspaceItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/demo", label: "Demo", icon: PlayCircle },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "M";
}

export function Navbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isWorkspace = Boolean(user) && !isAuthPage && pathname !== "/";

  useEffect(() => setMenuOpen(false), [pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/history?q=${encodeURIComponent(query)}` : "/history");
    setMenuOpen(false);
  };

  const navigation = (mobile = false) => workspaceItems.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`workspace-nav-link ${mobile ? "w-full" : ""}`}>
        <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
        <span>{label}</span>
      </Link>
    );
  });

  if (isAuthPage) return <>{children}</>;

  if (!isWorkspace) {
    return (
      <>
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex min-h-[76px] w-full max-w-[1440px] items-center justify-between gap-4 px-5 md:px-10">
            <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="MaxxLoop home">
              <span className="workspace-brand-mark"><Activity aria-hidden="true" className="h-5 w-5" /></span>
              <span><span className="block text-sm font-bold tracking-tight">MaxxLoop</span><span className="block text-xs text-textMuted">Focus &amp; recovery</span></span>
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
              <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="app-nav-link hidden text-textSecondary hover:bg-surfaceHover sm:inline-flex">Home</Link>
              <Link href="/privacy" aria-current={pathname === "/privacy" ? "page" : undefined} className="app-nav-link hidden items-center text-textSecondary hover:bg-surfaceHover sm:inline-flex"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Privacy</Link>
              {user ? <Link href="/dashboard" className="app-button-primary min-h-10 px-3 text-xs">Open workspace</Link> : !loading && <>
                <Link href="/login" className="app-nav-link text-accent hover:bg-accent/10"><UserRound aria-hidden="true" className="h-4 w-4" />Sign in</Link>
                <Link href="/signup" className="app-button-primary min-h-10 px-3 text-xs">Create account</Link>
              </>}
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-border bg-surface px-5 py-5 text-xs text-textMuted md:px-10">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3">
            <span>MaxxLoop · Focus and recovery, measured over time.</span>
            <Link href="/privacy" className="rounded-sm hover:text-textPrimary">Privacy and data controls</Link>
          </div>
        </footer>
      </>
    );
  }

  return (
    <div className="workspace-layout flex bg-background">
      {menuOpen && <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" />}
      <aside className={`workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col px-4 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`} aria-label="Workspace sidebar">
        <div className="mb-8 flex items-center justify-between px-1">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg" aria-label="MaxxLoop dashboard">
            <span className="workspace-brand-mark"><Activity aria-hidden="true" className="h-5 w-5" /></span>
            <span><span className="workspace-brand-title block text-[15px] font-bold tracking-tight">MaxxLoop</span><span className="workspace-muted block text-xs">Focus &amp; recovery</span></span>
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="workspace-sidebar-muted rounded-lg p-2 hover:bg-surfaceHover lg:hidden"><X className="h-5 w-5" /></button>
        </div>

        <Link href="/profile" className="workspace-profile mb-7 flex min-w-0 items-center gap-3 rounded-xl p-3 hover:bg-white/10">
          <span className="workspace-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold">{initials(user.name)}</span>
          <span className="min-w-0 flex-1"><span className="workspace-brand-title block truncate text-sm font-semibold">{user.name}</span><span className="workspace-muted block truncate text-xs">{user.email}</span></span>
          <ChevronDown aria-hidden="true" className="workspace-sidebar-muted h-4 w-4 shrink-0" />
        </Link>

        <p className="workspace-section-label mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.1em]">Workspace</p>
        <nav aria-label="Workspace navigation" className="space-y-1">{navigation()}</nav>

        <div className="mt-auto space-y-1 border-t border-border pt-4">
          <Link href="/privacy" aria-current={pathname === "/privacy" ? "page" : undefined} className="workspace-nav-link">
            <Settings2 aria-hidden="true" className="h-[18px] w-[18px]" /><span>Privacy &amp; settings</span>
          </Link>
          <button type="button" onClick={() => void signOut()} className="workspace-nav-link workspace-danger-hover w-full text-left">
            <X aria-hidden="true" className="h-[18px] w-[18px]" /><span>Sign out</span>
          </button>
          <p className="workspace-section-label px-3 pt-3 text-[11px]">Your capacity, understood.</p>
        </div>
      </aside>

      <div className="workspace-main flex min-h-screen flex-col">
        <header className="workspace-header sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" className="rounded-xl border border-border bg-surface p-2.5 text-textSecondary shadow-sm hover:bg-surfaceHover lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><p className="text-xs font-medium text-textMuted">Personal workspace</p><p className="truncate text-sm font-semibold text-textPrimary">{user.name}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={submitSearch} role="search" className="relative hidden sm:block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
              <input aria-label="Search your activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your activity" className="workspace-search pl-9" />
            </form>
            <Link href="/profile" className="avatar-circle" aria-label={`Profile: ${user.name}`}>{initials(user.name)}</Link>
          </div>
        </header>
        <div className="workspace-content flex-1">{children}</div>
        <footer className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-textMuted sm:px-8 lg:px-12">
          <span>MaxxLoop · Focus and recovery, measured over time.</span>
          <Link href="/privacy" className="hover:text-textPrimary">Privacy &amp; data</Link>
        </footer>
      </div>
    </div>
  );
}
