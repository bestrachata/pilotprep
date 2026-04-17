"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSttAvailable } from "@/lib/speech";
import {
  DEFAULT_WD_SETTINGS,
  WD_SETTINGS_KEY,
  type WalkDotOp,
  type WalkingDotSettings,
} from "@/lib/walkingDot";

// ─── Option definitions ────────────────────────────────────────────────────────

const SESSION_PRESETS = [
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "?", value: 0 }, // random + hidden
];

const FREQ_PRESETS: { label: string; value: WalkingDotSettings["questionFrequency"] }[] = [
  { label: "Low", value: "low" },
  { label: "Med", value: "medium" },
  { label: "High", value: "high" },
];

const WD_OPS: { id: WalkDotOp; label: string }[] = [
  { id: "add", label: "+" },
  { id: "sub", label: "−" },
  { id: "mul", label: "×" },
  { id: "div", label: "÷" },
  { id: "addSub", label: "+/−" },
];

// ─── Shared micro-components ───────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
      {children}
    </div>
  );
}

function Pills<T>({
  options,
  selected,
  onSelect,
  label,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
  label: (v: { label: string; value: T }) => string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt, i) => (
        <button
          key={i}
          onPointerDown={(e) => { e.preventDefault(); onSelect(opt.value); }}
          className={[
            "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95",
            opt.value === selected
              ? "bg-blue-600 text-white"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onPointerDown={(e) => { e.preventDefault(); if (value - step >= min) onChange(value - step); }}
          className={[
            "w-8 h-8 rounded-lg text-base font-bold flex items-center justify-center transition-all active:scale-90",
            value - step < min
              ? "bg-[var(--bg-card)] text-[var(--text-muted)] opacity-40"
              : "bg-[var(--bg-elevated)] text-white",
          ].join(" ")}
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-bold text-white tabular-nums">
          {value}
        </span>
        <button
          onPointerDown={(e) => { e.preventDefault(); if (value + step <= max) onChange(value + step); }}
          className={[
            "w-8 h-8 rounded-lg text-base font-bold flex items-center justify-center transition-all active:scale-90",
            value + step > max
              ? "bg-[var(--bg-card)] text-[var(--text-muted)] opacity-40"
              : "bg-[var(--bg-elevated)] text-white",
          ].join(" ")}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onChange(!value); }}
      className={[
        "flex-1 flex items-center justify-between rounded-xl px-3 py-2.5 transition-all",
        disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95",
        "bg-[var(--bg-card)]",
      ].join(" ")}
    >
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div
        className={[
          "w-10 h-5 rounded-full relative transition-colors",
          value && !disabled ? "bg-blue-600" : "bg-[var(--bg-elevated)]",
        ].join(" ")}
      >
        <div
          className={[
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            value && !disabled ? "translate-x-5 left-0.5" : "left-0.5",
          ].join(" ")}
        />
      </div>
    </button>
  );
}

// ─── Settings page ─────────────────────────────────────────────────────────────

export default function WalkingDotSettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<WalkingDotSettings>(DEFAULT_WD_SETTINGS);
  const [sttOk, setSttOk] = useState(false);

  useEffect(() => {
    setSttOk(isSttAvailable());
  }, []);

  function set<K extends keyof WalkingDotSettings>(k: K, v: WalkingDotSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function toggleOp(op: WalkDotOp) {
    setS((prev) => {
      const has = prev.operations.includes(op);
      if (has && prev.operations.length === 1) return prev;
      return {
        ...prev,
        operations: has
          ? prev.operations.filter((o) => o !== op)
          : [...prev.operations, op],
      };
    });
  }

  function handleMinDigits(v: number) {
    setS((prev) => ({ ...prev, minDigits: v, maxDigits: Math.max(prev.maxDigits, v) }));
  }

  function handleMaxDigits(v: number) {
    setS((prev) => ({ ...prev, maxDigits: v, minDigits: Math.min(prev.minDigits, v) }));
  }

  function handleMinBpm(v: number) {
    setS((prev) => ({ ...prev, minBpm: v, maxBpm: Math.max(prev.maxBpm, v) }));
  }

  function handleMaxBpm(v: number) {
    setS((prev) => ({ ...prev, maxBpm: v, minBpm: Math.min(prev.minBpm, v) }));
  }

  function handleStart() {
    localStorage.setItem(WD_SETTINGS_KEY, JSON.stringify(s));
    router.push("/multitask/walking-dot/play");
  }

  const isGradual = s.bpmMode === "gradual";

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onPointerDown={(e) => { e.preventDefault(); router.back(); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] active:scale-90 transition-all text-xl"
        >
          ‹
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">เดินจุด</h1>
          <p className="text-xs text-[var(--text-muted)]">Walking Dot — configure session</p>
        </div>
      </div>

      {/* Settings */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 flex flex-col gap-4">

        {/* Session time */}
        <div>
          <Label>Session time</Label>
          <Pills
            options={SESSION_PRESETS}
            selected={s.sessionSeconds}
            onSelect={(v) => set("sessionSeconds", v)}
            label={(o) => o.label}
          />
          {s.sessionSeconds === 0 && (
            <p className="text-[10px] text-amber-400 mt-1">
              Duration hidden — timer won&apos;t show during session
            </p>
          )}
        </div>

        {/* Math questions */}
        <div>
          <Label>Math questions</Label>
          {/* Operation toggles */}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {WD_OPS.map(({ id, label }) => (
              <button
                key={id}
                onPointerDown={(e) => { e.preventDefault(); toggleOp(id); }}
                className={[
                  "py-2.5 rounded-xl text-sm font-bold transition-all active:scale-90",
                  s.operations.includes(id)
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Digits and frequency in a card */}
          <div className="bg-[var(--bg-card)] rounded-2xl px-4 py-3 flex flex-col gap-2.5">
            <div className="flex gap-4">
              <div className="flex-1">
                <Stepper label="Min digits" value={s.minDigits} min={1} max={4} onChange={handleMinDigits} />
              </div>
              <div className="flex-1">
                <Stepper label="Max digits" value={s.maxDigits} min={1} max={4} onChange={handleMaxDigits} />
              </div>
            </div>
            <div className="h-px bg-[var(--bg-elevated)]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Frequency</span>
              <div className="flex gap-1.5">
                {FREQ_PRESETS.map((f) => (
                  <button
                    key={f.value}
                    onPointerDown={(e) => { e.preventDefault(); set("questionFrequency", f.value); }}
                    className={[
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95",
                      s.questionFrequency === f.value
                        ? "bg-blue-600 text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metronome */}
        <div>
          <Label>Metronome</Label>
          <div className="bg-[var(--bg-card)] rounded-2xl px-4 py-3 flex flex-col gap-2.5">
            <div className="flex gap-4">
              <div className="flex-1">
                <Stepper label="Min BPM" value={s.minBpm} min={40} max={200} step={5} onChange={handleMinBpm} />
              </div>
              {isGradual && (
                <div className="flex-1">
                  <Stepper label="Max BPM" value={s.maxBpm} min={40} max={200} step={5} onChange={handleMaxBpm} />
                </div>
              )}
            </div>
            <div className="h-px bg-[var(--bg-elevated)]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Tempo</span>
              <div className="flex gap-1.5">
                {(["constant", "gradual"] as const).map((mode) => (
                  <button
                    key={mode}
                    onPointerDown={(e) => { e.preventDefault(); set("bpmMode", mode); }}
                    className={[
                      "px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all active:scale-95",
                      s.bpmMode === mode
                        ? "bg-blue-600 text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {mode === "gradual" ? "Gradual ↑" : "Constant"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Voice */}
        <div>
          <Label>Voice</Label>
          <div className="flex gap-2">
            <Toggle
              label="Read aloud"
              value={s.readAloud}
              onChange={(v) => set("readAloud", v)}
            />
            <Toggle
              label="Voice answer"
              value={s.voiceAnswer}
              onChange={(v) => set("voiceAnswer", v)}
              disabled={!sttOk}
            />
          </div>
          {!sttOk && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Voice answer not supported in this browser
            </p>
          )}
        </div>
      </div>

      {/* Start */}
      <div className="shrink-0 px-4 pt-3 pb-6">
        <button
          onPointerDown={(e) => { e.preventDefault(); handleStart(); }}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/50"
        >
          Start Session →
        </button>
      </div>
    </div>
  );
}
