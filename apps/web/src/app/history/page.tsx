"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";

interface SignalRecord { id: number; kind: string; value: number; source: string; ts: string }

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const loadHistory = () => {
    setLoading(true);
    setError(false);
    api.getHistory().then((rows) => setSignals(rows as SignalRecord[])).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(() => { loadHistory(); }, []);
  useEffect(() => setQuery(searchParams.get("q") ?? ""), [searchParams]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return signals;
    return signals.filter((signal) => `${signal.kind} ${signal.source} ${signal.value}`.toLowerCase().includes(term));
  }, [query, signals]);

  return (
    <main id="main-content" tabIndex={-1} className="flex w-full flex-1 flex-col gap-6 pb-12">
      <PageHeader eyebrow="Your data" title="Check-in history" description="A private timeline of the signals you have recorded in your account." />
      <section className="app-panel overflow-hidden" aria-label="Check-in history">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="text-sm font-semibold text-textPrimary">Recorded signals</h2><p className="mt-1 text-xs text-textMuted">{signals.length} {signals.length === 1 ? "entry" : "entries"}</p></div>
          <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Filter check-ins</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter your history" className="app-field min-h-10 pl-9" /></label>
        </div>
        {error && <div className="p-4 sm:p-5"><StatusMessage kind="error" action={<button onClick={loadHistory} className="app-button-secondary min-h-9 px-3 text-xs">Retry</button>}>Your history could not be loaded. Please retry.</StatusMessage></div>}
        {loading ? <div role="status" className="p-8 text-center text-sm text-textSecondary">Loading your history…</div> : !error && filtered.length === 0 ? <div className="empty-state m-4 sm:m-5"><div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Activity className="h-5 w-5" /></span><p className="text-sm font-semibold text-textPrimary">{signals.length ? "No matching check-ins" : "Your history starts with a check-in"}</p><p className="mt-1 max-w-sm text-sm text-textSecondary">{signals.length ? "Try a different search term." : "Recorded signals from your loops will appear here."}</p></div></div> : !error && <div className="divide-y divide-border/80">
          {filtered.map((signal) => <article key={signal.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Activity aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0"><h3 className="truncate text-sm font-semibold capitalize text-textPrimary">{signal.kind.replaceAll("_", " ")}</h3><p className="mt-1 truncate text-xs capitalize text-textMuted">{signal.source.replaceAll("_", " ")}</p></div></div>
            <div className="ml-auto text-right"><p className="font-mono text-sm font-semibold text-textPrimary">{signal.value}</p><time className="mt-1 block text-xs text-textMuted" dateTime={signal.ts}>{new Date(signal.ts).toLocaleString()}</time></div>
          </article>)}
        </div>}
      </section>
    </main>
  );
}
