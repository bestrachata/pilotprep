import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aptitude — Pilot Prep" };

const SUBMODULES = [
  {
    id: "folding-box",
    titleTh: "พับกล่อง",
    titleEn: "Folding Box",
    description:
      "Identify which 2D net correctly folds into the shown 3D box",
    tags: ["Spatial", "Abstract", "Timed"],
    active: true,
    href: "/aptitude/folding-box",
  },
  {
    id: "pattern",
    titleTh: "",
    titleEn: "Pattern Completion",
    description: "Choose the piece that completes the visual matrix",
    tags: ["Abstract", "Logic"],
    active: false,
  },
  {
    id: "rotation",
    titleTh: "",
    titleEn: "Mental Rotation",
    description: "Match rotated 3D objects to their original form",
    tags: ["Spatial", "3D"],
    active: false,
  },
];

export default function AptitudePage() {
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
            Aptitude
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Spatial &amp; abstract reasoning
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
                  ? "bg-gradient-to-br from-violet-600 to-violet-900 shadow-lg shadow-violet-900/40 active:scale-[0.98]"
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
                      className={`text-sm font-semibold ${mod.active ? "text-violet-100" : "text-[var(--text-secondary)]"}`}
                    >
                      {mod.titleEn}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${mod.active ? "text-violet-200" : "text-[var(--text-muted)]"}`}
                  >
                    {mod.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          mod.active
                            ? "bg-violet-500/40 text-violet-100"
                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {mod.active ? (
                  <span className="text-violet-200 text-xl mt-1">→</span>
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
