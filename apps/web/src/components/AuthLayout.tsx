import { Activity, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const stages = ["Track", "Understand", "Act", "Measure", "Improve"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-story" aria-label="About MaxxLoop">
        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-lg" aria-label="MaxxLoop home">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-emerald-500 text-white"><Activity className="h-6 w-6" aria-hidden="true" /></span>
          <span><span className="block text-base font-bold tracking-tight">MaxxLoop</span><span className="block text-sm text-emerald-100/70">Focus &amp; recovery</span></span>
        </Link>

        <div className="relative z-10 my-12 max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.14em] text-emerald-300">A more considered way to reset</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl">Understand what changes your capacity.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/70">Build a clearer picture of focus and recovery with small check-ins, practical actions, and outcomes measured over time.</p>
        </div>

        <div className="auth-visual-card w-full max-w-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-xs font-medium text-emerald-100/65">The MaxxLoop method</p><p className="mt-1 text-lg font-semibold">A personal learning cycle</p></div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><Activity className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <ol className="grid grid-cols-5 gap-2" aria-label="Track, understand, act, measure, improve">
            {stages.map((stage, index) => <li key={stage} className="min-w-0 text-center">
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl border border-emerald-100/15 bg-white/5 text-xs font-semibold text-emerald-200">0{index + 1}</span>
              <span className="mt-2 block truncate text-[11px] text-emerald-50/75">{stage}</span>
            </li>)}
          </ol>
          <div className="mt-6 rounded-xl border border-white/10 bg-[#10201b]/80 p-4">
            <div className="flex items-center justify-between"><span className="text-xs text-emerald-50/65">Your focus, over time</span><span className="text-[11px] text-emerald-300">Measured privately</span></div>
            <svg aria-hidden="true" viewBox="0 0 520 78" className="mt-3 h-16 w-full" preserveAspectRatio="none">
              <path d="M2 58 C40 55 44 33 86 40 S133 55 172 31 S225 47 266 26 S310 36 350 19 S403 42 442 22 S486 20 518 8" fill="none" stroke="#4ed5a5" strokeWidth="3" strokeLinecap="round" />
              <path d="M2 70H518" stroke="rgba(255,255,255,.14)" strokeDasharray="4 6" />
              <circle cx="350" cy="19" r="5" fill="#4ed5a5" stroke="#18372d" strokeWidth="3" />
            </svg>
            <p className="text-[10px] text-emerald-50/50">Illustrative view · your dashboard uses your own measurements</p>
          </div>
        </div>

        <p className="relative z-10 mt-8 flex items-center gap-2 text-xs text-emerald-50/60"><Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />Private to your account. Built around small, measurable steps.</p>
      </aside>

      <div className="auth-content">
        <div className="w-full max-w-[430px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-textPrimary sm:hidden"><span className="workspace-brand-mark"><Activity className="h-4 w-4" aria-hidden="true" /></span>MaxxLoop</Link>
          {children}
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-textMuted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Secure, private access to your workspace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></p>
        </div>
      </div>
    </div>
  );
}
