"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Operation, MathSettings } from "@/lib/math";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "@/lib/math";

// ─── Preset options ────────────────────────────────────────────────────────────

const TIME_PRESETS = [
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "20s", value: 20 },
  { label: "30s", value: 30 },
  { label: "∞", value: 0 },
];

const COUNT_PRESETS = [5, 10, 15, 20, 25, 30];

const OPS: { id: Operation; label: string }[] = [
  { id: "add", label: "+" },
  { id: "sub", label: "−" },
  { id: "mul", label: "×" },
  { id: "div", label: "÷" },
  { id: "exp", label: "xⁿ" },
  { id: "sqrt", label: "√" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
      {children}
    </div>
  );
}

function PillGroup<T>({
  options,
  selected,
  onSelect,
  renderLabel,
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  renderLabel: (v: T) => string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt, i) => {
        const active = opt === selected;
        return (
          <button
            key={i}
            onPointerDown={(e) => {
              e.preventDefault();
              onSelect(opt);
            }}
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95",
              active
                ? "bg-blue-600 text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {renderLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            if (value > min) onChange(value - 1);
          }}
          className={[
            "w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center transition-all active:scale-90",
            value <= min
              ? "bg-[var(--bg-card)] text-[var(--text-muted)] opacity-40"
              : "bg-[var(--bg-elevated)] text-[var(--text-primary)]",
          ].join(" ")}
        >
          −
        </button>
        <span className="w-4 text-center text-base font-bold text-white">
          {value}
        </span>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            if (value < max) onChange(value + 1);
          }}
          className={[
            "w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center transition-all active:scale-90",
            value >= max
              ? "bg-[var(--bg-card)] text-[var(--text-muted)] opacity-40"
              : "bg-[var(--bg-elevated)] text-[var(--text-primary)]",
          ].join(" ")}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main settings page ────────────────────────────────────────────────────────

export default function MathSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<MathSettings>(DEFAULT_SETTINGS);

  function set<K extends keyof MathSettings>(key: K, value: MathSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function toggleOp(op: Operation) {
    setSettings((s) => {
      const has = s.operations.includes(op);
      // Must keep at least one operation selected
      if (has && s.operations.length === 1) return s;
      return {
        ...s,
        operations: has
          ? s.operations.filter((o) => o !== op)
          : [...s.operations, op],
      };
    });
  }

  function handleMinDigits(v: number) {
    setSettings((s) => ({
      ...s,
      minDigits: v,
      maxDigits: Math.max(s.maxDigits, v),
    }));
  }

  function handleMaxDigits(v: number) {
    setSettings((s) => ({
      ...s,
      maxDigits: v,
      minDigits: Math.min(s.minDigits, v),
    }));
  }

  function handleStart() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    router.push("/math/play");
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            router.back();
          }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] active:scale-90 transition-all"
        >
          ‹
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">
            Mental Math
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Configure your session</p>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 min-h-0 px-4 flex flex-col gap-5 overflow-hidden">

        {/* Time Limit */}
        <div>
          <SectionLabel>Time per question</SectionLabel>
          <PillGroup
            options={TIME_PRESETS}
            selected={TIME_PRESETS.find((p) => p.value === settings.timeLimitSeconds)!}
            onSelect={(p) => set("timeLimitSeconds", p.value)}
            renderLabel={(p) => p.label}
          />
        </div>

        {/* Number of Questions */}
        <div>
          <SectionLabel>Number of questions</SectionLabel>
          <PillGroup
            options={COUNT_PRESETS}
            selected={settings.questionCount}
            onSelect={(v) => set("questionCount", v)}
            renderLabel={(v) => String(v)}
          />
        </div>

        {/* Digit Range */}
        <div>
          <SectionLabel>Digit range</SectionLabel>
          <div className="bg-[var(--bg-card)] rounded-2xl px-4 py-3 flex flex-col gap-3">
            <Stepper
              label="Min digits"
              value={settings.minDigits}
              min={1}
              max={4}
              onChange={handleMinDigits}
            />
            <div className="h-px bg-[var(--bg-elevated)]" />
            <Stepper
              label="Max digits"
              value={settings.maxDigits}
              min={1}
              max={4}
              onChange={handleMaxDigits}
            />
          </div>
        </div>

        {/* Operations */}
        <div>
          <SectionLabel>Operations</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {OPS.map(({ id, label }) => {
              const active = settings.operations.includes(id);
              return (
                <button
                  key={id}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    toggleOp(id);
                  }}
                  className={[
                    "py-3 rounded-xl text-xl font-bold transition-all active:scale-90",
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--bg-card)] text-[var(--text-muted)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="shrink-0 px-4 pt-3 pb-6">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            handleStart();
          }}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/50"
        >
          Start Session →
        </button>
      </div>
    </div>
  );
}
