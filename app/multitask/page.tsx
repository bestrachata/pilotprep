import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Multi-tasking — Pilot Prep" };

const SUBMODULES = [
  {
    id: "walking-dot",
    titleTh: "เดินจุด",
    titleEn: "Walking Dot",
    description: "Metronome-paced movement with random mental math interruptions",
    tags: ["Metronome", "Mental Math", "Voice"],
    active: true,
    href: "/multitask/walking-dot",
  },
  {
    id: "tracking",
    titleTh: "",
    titleEn: "Target Tracking",
    description: "Track multiple moving targets while answering questions",
    tags: ["Visual", "Attention"],
    active: false,
  },
  {
    id: "memory-math",
    titleTh: "",
    titleEn: "Memory + Math",
    description: "Hold a number sequence in memory while computing answers",
    tags: ["Working Memory", "Arithmetic"],
    active: false,
  },
];

export default function MultitaskPage() {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-4">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] active:scale-90 transition-all text-xl"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">
            Multi-tasking
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Dual-task performance training
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="shrink-0 px-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Sub-modules
        </span>
      </div>

      {/* Sub-module list */}
      <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col gap-3 overflow-hidden">
        {SUBMODULES.map((mod) => {
          const card = (
            <div
              className={[
                "rounded-2xl p-4 transition-all",
                mod.active
                  ? "bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/40 active:scale-[0.98]"
                  : "bg-[var(--bg-card)] opacity-60",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    {mod.titleTh && (
                      <span
                        className={`text-base font-bold ${mod.active ? "text-white" : "text-[var(--text-muted)]"}`}
                      >
                        {mod.titleTh}
                      </span>
                    )}
                    <span
                      className={`text-sm font-semibold ${mod.active ? "text-blue-100" : "text-[var(--text-secondary)]"}`}
                    >
                      {mod.titleEn}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${mod.active ? "text-blue-200" : "text-[var(--text-muted)]"}`}
                  >
                    {mod.description}
                  </p>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          mod.active
                            ? "bg-blue-500/40 text-blue-100"
                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {mod.active ? (
                  <span className="text-blue-200 text-xl mt-1">→</span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-elevated)] text-[var(--text-muted)] px-2 py-1 rounded-full mt-1">
                    Soon
                  </span>
                )}
              </div>
            </div>
          );

          return mod.active && mod.href ? (
            <Link key={mod.id} href={mod.href} className="block shrink-0">
              {card}
            </Link>
          ) : (
            <div key={mod.id} className="shrink-0 cursor-not-allowed">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
