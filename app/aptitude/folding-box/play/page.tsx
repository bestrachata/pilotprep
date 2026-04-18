"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TimerBar from "@/components/TimerBar";
import {
  DEFAULT_FB_SETTINGS,
  FB_SETTINGS_KEY,
  generatePuzzles,
  type BoxFaces,
  type FoldingBoxPuzzle,
  type FoldingBoxSettings,
  type NetLayout,
} from "@/lib/foldingBox";

// ─── SVG Isometric Cube ────────────────────────────────────────────────────────
//
// Standard isometric projection — three visible faces.
// ViewBox 140 × 160.  All vertex coordinates are pre-calculated for size = 80.
//
//  Hexagon vertices (absolute):
//    T  = (70,  0)    — top point
//    TR = (139, 40)   — top-right
//    BR = (139, 120)  — bottom-right
//    B  = (70,  160)  — bottom point
//    BL = (1,   120)  — bottom-left
//    TL = (1,   40)   — top-left
//    C  = (70,  80)   — center
//
//  Visible faces:
//    Top face   : T  → TR → C  → TL
//    Front face : TL → C  → B  → BL   (left rhombus in iso = front of box)
//    Right face : TR → BR → B  → C    (right rhombus in iso = right of box)

function IsoBox({ box }: { box: BoxFaces }) {
  return (
    <svg
      width="100%"
      viewBox="0 0 140 160"
      style={{ maxWidth: 200, display: "block", margin: "0 auto" }}
    >
      <defs>
        <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter="url(#boxShadow)">
        {/* Front face (left rhombus) */}
        <polygon points="1,40 70,80 70,160 1,120" fill={box.front} />
        <polygon points="1,40 70,80 70,160 1,120" fill="rgba(0,0,0,0.13)" />

        {/* Right face (right rhombus) */}
        <polygon points="139,40 139,120 70,160 70,80" fill={box.right} />
        <polygon points="139,40 139,120 70,160 70,80" fill="rgba(0,0,0,0.27)" />

        {/* Top face (horizontal diamond) — rendered last so it's on top */}
        <polygon points="70,0 139,40 70,80 1,40" fill={box.top} />
        {/* Subtle shine on top */}
        <polygon points="70,0 104,20 70,40 36,20" fill="rgba(255,255,255,0.08)" />
      </g>

      {/* Crisp outlines */}
      <polygon points="1,40 70,80 70,160 1,120" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="139,40 139,120 70,160 70,80" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="70,0 139,40 70,80 1,40" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Net Grid ──────────────────────────────────────────────────────────────────
//
// Cross layout:
//            (2,0) top
//  (0,1) left  (1,1) front  (2,1) right  (3,1) back
//            (2,2) bottom

function NetGrid({ net, cellSize = 30 }: { net: NetLayout; cellSize?: number }) {
  const gap = 2;
  const W = 4 * cellSize + 3 * gap;
  const H = 3 * cellSize + 2 * gap;

  const cells: [number, number, string, string][] = [
    [2, 0, net.top,    "T"],
    [0, 1, net.left,   "L"],
    [1, 1, net.front,  "F"],
    [2, 1, net.right,  "R"],
    [3, 1, net.back,   "B"],
    [2, 2, net.bottom, "D"],
  ];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {cells.map(([col, row, color, label]) => {
        const x = col * (cellSize + gap);
        const y = row * (cellSize + gap);
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        return (
          <g key={label}>
            <rect x={x} y={y} width={cellSize} height={cellSize} fill={color} rx="3" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Small face label for reference */}
            <text
              x={cx} y={cy + 4}
              textAnchor="middle"
              fontSize={cellSize * 0.38}
              fontWeight="700"
              fill="rgba(0,0,0,0.45)"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Results screen ────────────────────────────────────────────────────────────

function Results({
  correct,
  total,
  onRetry,
  onMenu,
}: {
  correct: number;
  total: number;
  onRetry: () => void;
  onMenu: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  return (
    <div className="h-full flex flex-col items-center justify-between overflow-hidden px-6 py-8" style={{ background: "var(--bg-base)" }}>
      <div />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`text-7xl font-black ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
          {pct}%
        </div>
        <div className="text-[var(--text-secondary)] text-base">
          {correct} of {total} correct
        </div>
        <div className="text-4xl mt-2">
          {pct === 100 ? "🎯" : pct >= 80 ? "✈️" : pct >= 50 ? "📐" : "📦"}
        </div>
        <div className={`text-sm font-semibold ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
          {pct === 100 ? "Perfect spatial reasoning!" : pct >= 80 ? "Strong spatial skills" : pct >= 50 ? "Keep practising" : "Needs improvement"}
        </div>
      </div>
      <div className="flex gap-3 w-full">
        <button onPointerDown={(e) => { e.preventDefault(); onMenu(); }} className="flex-1 py-4 rounded-2xl bg-[var(--bg-card)] text-[var(--text-secondary)] font-semibold active:scale-95 transition-all">
          Menu
        </button>
        <button onPointerDown={(e) => { e.preventDefault(); onRetry(); }} className="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-violet-900/50">
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Main play page ────────────────────────────────────────────────────────────

type Phase = "loading" | "playing" | "done";
type Feedback = "none" | "correct" | "wrong";

export default function FoldingBoxPlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [settings, setSettings] = useState<FoldingBoxSettings>(DEFAULT_FB_SETTINGS);
  const [puzzles, setPuzzles] = useState<FoldingBoxPuzzle[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(FB_SETTINGS_KEY);
    const s: FoldingBoxSettings = saved ? JSON.parse(saved) : DEFAULT_FB_SETTINGS;
    setSettings(s);
    setPuzzles(generatePuzzles(s.questionCount));
    setTimeRemaining(s.timeLimitSeconds);
    setPhase("playing");
  }, []);

  // ── Per-question timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || settings.timeLimitSeconds === 0 || feedback !== "none") return;
    if (timeRemaining <= 0) {
      handleChoice(-1); // timed out — no choice made
      return;
    }
    const id = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase, feedback]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ── Answer handler ──────────────────────────────────────────────────────────
  function handleChoice(choiceIdx: number) {
    if (feedback !== "none" || phase !== "playing") return;

    const puzzle = puzzles[idx];
    const isCorrect = choiceIdx === puzzle.correctIndex;

    setSelected(choiceIdx);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);

    const delay = isCorrect ? 700 : 1200;
    feedbackTimerRef.current = setTimeout(() => {
      const next = idx + 1;
      if (next >= puzzles.length) {
        setPhase("done");
      } else {
        setIdx(next);
        setSelected(null);
        setFeedback("none");
        setTimeRemaining(settings.timeLimitSeconds);
      }
    }, delay);
  }

  // ── Retry ───────────────────────────────────────────────────────────────────
  function retry() {
    setPuzzles(generatePuzzles(settings.questionCount));
    setIdx(0);
    setSelected(null);
    setFeedback("none");
    setScore(0);
    setTimeRemaining(settings.timeLimitSeconds);
    setPhase("playing");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return <div className="h-full" style={{ background: "var(--bg-base)" }} />;
  }

  if (phase === "done") {
    return (
      <Results
        correct={score}
        total={puzzles.length}
        onRetry={retry}
        onMenu={() => router.push("/aptitude")}
      />
    );
  }

  const puzzle = puzzles[idx];
  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3" style={{ background: "var(--bg-surface)" }}>
        <button
          onPointerDown={(e) => { e.preventDefault(); router.push("/aptitude/folding-box"); }}
          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] active:text-white text-xl"
        >
          ‹
        </button>

        {/* Dot progress */}
        <div className="flex items-center gap-1.5">
          {puzzles.map((_, i) => (
            <div key={i} className={[
              "rounded-full transition-all",
              i < idx ? "bg-violet-500 w-2 h-2"
                : i === idx ? "bg-violet-300 w-2.5 h-2.5"
                : "bg-[var(--bg-elevated)] w-2 h-2",
            ].join(" ")} />
          ))}
        </div>

        {/* Timer */}
        {settings.timeLimitSeconds > 0 ? (
          <div className={`text-sm font-bold tabular-nums min-w-[2.5rem] text-right ${timeRemaining <= 5 ? "text-red-400" : "text-[var(--text-secondary)]"}`}>
            {timeRemaining}s
          </div>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <TimerBar total={settings.timeLimitSeconds} remaining={timeRemaining} />

      {/* 3D Cube */}
      <div className="shrink-0 flex flex-col items-center justify-center py-4 px-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Which net folds into this cube?
        </p>
        <IsoBox box={puzzle.box} />
        {/* Visible face legend */}
        <div className="flex gap-3 mt-3">
          {[
            { label: "Top", color: puzzle.box.top },
            { label: "Front", color: puzzle.box.front },
            { label: "Right", color: puzzle.box.right },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2×2 Choice grid */}
      <div className="flex-1 min-h-0 px-3 pb-3 grid grid-cols-2 gap-2">
        {puzzle.choices.map((choice, i) => {
          // Determine card style based on feedback state
          let cardStyle = "bg-[var(--bg-card)] border border-[var(--bg-elevated)]";
          if (feedback !== "none") {
            if (i === puzzle.correctIndex) {
              cardStyle = "bg-emerald-950 border border-emerald-500";
            } else if (i === selected) {
              cardStyle = "bg-red-950 border border-red-600";
            } else {
              cardStyle = "bg-[var(--bg-card)] border border-[var(--bg-elevated)] opacity-40";
            }
          }

          return (
            <button
              key={i}
              onPointerDown={(e) => { e.preventDefault(); handleChoice(i); }}
              disabled={feedback !== "none"}
              className={[
                "rounded-2xl transition-all flex flex-col items-center justify-center gap-1.5 active:scale-[0.97]",
                cardStyle,
              ].join(" ")}
            >
              {/* Choice label */}
              <div className={[
                "text-xs font-bold",
                feedback !== "none" && i === puzzle.correctIndex ? "text-emerald-400"
                  : feedback !== "none" && i === selected ? "text-red-400"
                  : "text-[var(--text-muted)]",
              ].join(" ")}>
                {LABELS[i]}
                {feedback !== "none" && i === puzzle.correctIndex && " ✓"}
                {feedback !== "none" && i === selected && !choice.isCorrect && " ✗"}
              </div>

              {/* Net SVG */}
              <NetGrid net={choice.net} cellSize={28} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
