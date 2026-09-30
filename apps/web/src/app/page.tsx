import Link from "next/link";
import { Activity, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";

const steps = [
  ["01", "Notice", "A brief check-in tracks focus, energy, and stress."],
  ["02", "Understand", "See which signals may be affecting your capacity."],
  ["03", "Try one action", "Choose a small recovery action that fits your moment."],
  ["04", "Measure", "Check what changed and build a more personal loop."],
];

export default function LandingPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-16 pt-10 md:px-8 md:pt-20">
      <section className="grid items-center gap-10 py-8 md:grid-cols-[1.1fr_.9fr] md:gap-16 md:py-14">
        <div className="space-y-6">
          <div className="app-eyebrow flex items-center gap-2"><Activity aria-hidden="true" className="h-4 w-4" /> Focus and recovery, measured over time</div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-textPrimary md:text-6xl">Protect your capacity. <span className="text-accent">Close the loop.</span></h1>
          <p className="max-w-xl text-base leading-relaxed text-textSecondary md:text-lg">MaxxLoop helps you notice changes in focus and energy, understand possible drivers, try one practical action, and learn from what actually helps.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="app-button-primary">Create your account <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            <Link href="/login" className="app-button-secondary">Sign in</Link>
          </div>
          <p className="flex items-center gap-2 text-xs text-textMuted"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-accent" /> Your account data is private to you.</p>
        </div>
        <div className="app-panel relative overflow-hidden p-5 md:p-7">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between"><span className="app-eyebrow">A personal feedback loop</span><Sparkles aria-hidden="true" className="h-4 w-4 text-accent" /></div>
            <div className="space-y-3">
              {steps.map(([number, title, detail], index) => <div key={number} className="flex gap-3 rounded-xl border border-border bg-background/70 p-3.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${index === 3 ? "bg-accent/15 text-accent" : "bg-surfaceHover text-textSecondary"}`}>{index === 3 ? <Check aria-hidden="true" className="h-4 w-4" /> : number}</span>
                <div><h2 className="text-sm font-semibold text-textPrimary">{title}</h2><p className="mt-1 text-xs leading-relaxed text-textSecondary">{detail}</p></div>
              </div>)}
            </div>
          </div>
        </div>
      </section>
      <footer className="mt-auto border-t border-border/70 pt-5 text-xs text-textMuted">MaxxLoop is a focus and recovery companion, not a medical service. <Link href="/privacy" className="ml-2 text-textSecondary underline underline-offset-4">Privacy</Link></footer>
    </main>
  );
}
