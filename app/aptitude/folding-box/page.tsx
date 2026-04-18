"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_FB_SETTINGS,
  FB_SETTINGS_KEY,
  type FoldingBoxSettings,
} from "@/lib/foldingBox";

const COUNT_OPTIONS = [5, 10, 15, 20];
const TIME_OPTIONS = [
  { label: "∞", value: 0 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "20s", value: 20 },
  { label: "30s", value: 30 },
];

export default function FoldingBoxSettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<FoldingBoxSettings>(DEFAULT_FB_SETTINGS);

  function set<K extends keyof FoldingBoxSettings>(k: K, v: FoldingBoxSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function handleStart() {
    localStorage.setItem(FB_SETTINGS_KEY, JSON.stringify(s));
    router.push("/aptitude/folding-box/play");
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onPointerDown={(e) => { e.preventDefault(); router.back(); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] active:scale-90 transition-all text-xl"
        >
          ‹
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">พับกล่อง</h1>
          <p className="text-xs text-[var(--text-muted)]">Folding Box — configure session</p>
        </div>
      </div>

      {/* Preview of what the test looks like */}
      <div className="shrink-0 mx-4 mb-4 rounded-2xl bg-[var(--bg-card)] px-4 py-3 flex items-center gap-4">
        {/* Mini cube preview */}
        <svg width="56" height="64" viewBox="0 0 140 160">
          <polygon points="70,0 139,40 70,80 1,40" fill="#60a5fa" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
          <polygon points="1,40 70,80 70,160 1,120" fill="#4ade80" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
          <polygon points="1,40 70,80 70,160 1,120" fill="rgba(0,0,0,0.12)" />
          <polygon points="139,40 139,120 70,160 70,80" fill="#ef4444" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
          <polygon points="139,40 139,120 70,160 70,80" fill="rgba(0,0,0,0.25)" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-white">How it works</p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
            A 3D cube is shown. Choose the 2D net that correctly folds into it.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 flex flex-col gap-5 overflow-hidden">

        {/* Number of questions */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Number of questions
          </div>
          <div className="flex gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onPointerDown={(e) => { e.preventDefault(); set("questionCount", n); }}
                className={[
                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                  s.questionCount === n
                    ? "bg-violet-600 text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Time per question
          </div>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onPointerDown={(e) => { e.preventDefault(); set("timeLimitSeconds", opt.value); }}
                className={[
                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                  s.timeLimitSeconds === opt.value
                    ? "bg-violet-600 text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start */}
      <div className="shrink-0 px-4 pt-3 pb-6">
        <button
          onPointerDown={(e) => { e.preventDefault(); handleStart(); }}
          className="w-full py-4 rounded-2xl bg-violet-600 text-white text-lg font-bold active:scale-95 transition-all shadow-lg shadow-violet-900/50"
        >
          Start Session →
        </button>
      </div>
    </div>
  );
}
