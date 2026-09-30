import { Check } from "lucide-react";
import { LoopStage } from "@/types";

const stages: { id: LoopStage; label: string }[] = [
  { id: "track", label: "Track" },
  { id: "understand", label: "Understand" },
  { id: "act", label: "Act" },
  { id: "measure", label: "Measure" },
  { id: "improve", label: "Improve" },
];

export function CycleProgress({ currentStage }: { currentStage: LoopStage }) {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStage);
  return (
    <section aria-label={`MaxxLoop cycle. Current stage: ${stages[currentIndex]?.label ?? "Track"}`} className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold text-textPrimary">Your MaxxLoop cycle</p><p className="mt-0.5 text-xs text-textMuted">Small steps, measured over time</p></div>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">{stages[currentIndex]?.label ?? "Track"}</span>
      </div>
      <ol className="grid grid-cols-5 gap-1.5">
        {stages.map((stage, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          return <li key={stage.id} aria-current={active ? "step" : undefined} className="relative flex min-w-0 flex-col items-center gap-1.5 text-center">
            {index < stages.length - 1 && <span aria-hidden="true" className={`absolute left-[calc(50%+17px)] right-[calc(-50%+17px)] top-4 h-px ${index < currentIndex ? "bg-accent" : "bg-border"}`} />}
            <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-[10px] font-semibold ${complete ? "border-accent bg-accent text-primaryForeground" : active ? "border-accent bg-accent/10 text-accent ring-4 ring-accent/10" : "border-border bg-surface text-textMuted"}`}>
              {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : `0${index + 1}`}
            </span>
            <span className={`max-w-full truncate text-[10px] sm:text-xs ${active ? "font-semibold text-textPrimary" : complete ? "text-accent" : "text-textMuted"}`}>{stage.label}</span>
          </li>;
        })}
      </ol>
    </section>
  );
}
