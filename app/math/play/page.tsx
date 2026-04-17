"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NumberKeyboard from "@/components/NumberKeyboard";
import TimerBar from "@/components/TimerBar";
import {
  generateQuestions,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  type MathSettings,
  type Question,
} from "@/lib/math";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "playing" | "results";
type Feedback = "none" | "correct" | "wrong";

interface QuestionResult {
  questionDisplay: string;
  correctAnswer: number;
  userAnswerStr: string;
  isCorrect: boolean;
  timeTaken: number; // seconds
}

// ─── Results Screen ────────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  onRetry,
  onMenu,
}: {
  results: QuestionResult[];
  onRetry: () => void;
  onMenu: () => void;
}) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const accuracy = Math.round((correct / total) * 100);
  const avgTime =
    results.length > 0
      ? (results.reduce((s, r) => s + r.timeTaken, 0) / results.length).toFixed(1)
      : "—";
  const wrong = results.filter((r) => !r.isCorrect);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Score hero */}
      <div className="shrink-0 flex flex-col items-center pt-8 pb-4 px-4">
        <div
          className={[
            "text-6xl font-black mb-1",
            accuracy >= 80 ? "text-emerald-400" : accuracy >= 50 ? "text-amber-400" : "text-red-400",
          ].join(" ")}
        >
          {accuracy}%
        </div>
        <div className="text-[var(--text-secondary)] text-sm">
          {correct} of {total} correct · avg {avgTime}s
        </div>
      </div>

      {/* Wrong answers list */}
      <div className="flex-1 min-h-0 px-4 overflow-hidden">
        {wrong.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-4xl">🎯</div>
            <div className="text-emerald-400 font-semibold">Perfect score!</div>
          </div>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Missed questions
            </div>
            <div className="flex flex-col gap-2 overflow-hidden" style={{ maxHeight: "100%" }}>
              {wrong.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[var(--bg-card)] rounded-xl px-4 py-2.5"
                >
                  <span className="text-sm font-mono text-[var(--text-secondary)]">
                    {r.questionDisplay}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    {r.userAnswerStr ? (
                      <span className="text-red-400 line-through font-mono">
                        {r.userAnswerStr}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                    <span className="text-emerald-400 font-bold font-mono">
                      {r.correctAnswer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 flex gap-3 px-4 pt-3 pb-6">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onMenu();
          }}
          className="flex-1 py-4 rounded-2xl bg-[var(--bg-card)] text-[var(--text-secondary)] font-semibold active:scale-95 transition-all"
        >
          Menu
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onRetry();
          }}
          className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/40"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Session Screen ────────────────────────────────────────────────────────────

export default function MathPlayPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [settings, setSettings] = useState<MathSettings>(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);

  // Track when the current question started for timing
  const questionStartTime = useRef(Date.now());

  // ── Bootstrap: read settings from localStorage on mount ─────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const s: MathSettings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    const qs = generateQuestions(s);
    setSettings(s);
    setQuestions(qs);
    setTimeRemaining(s.timeLimitSeconds);
    setPhase("playing");
    questionStartTime.current = Date.now();
  }, []);

  // ── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || settings.timeLimitSeconds === 0 || feedback !== "none") return;
    if (timeRemaining <= 0) {
      // Time expired — treat as wrong
      submitAnswer(answer, true);
      return;
    }
    const id = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase, feedback]);

  // ── Auto-advance after feedback flash ────────────────────────────────────────
  useEffect(() => {
    if (feedback === "none") return;
    const delay = feedback === "correct" ? 700 : 1100;
    const id = setTimeout(() => {
      const next = currentIndex + 1;
      if (next >= questions.length) {
        setPhase("results");
      } else {
        setCurrentIndex(next);
        setAnswer("");
        setFeedback("none");
        setTimeRemaining(settings.timeLimitSeconds);
        questionStartTime.current = Date.now();
      }
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  // ── Physical keyboard support ─────────────────────────────────────────────────
  const handleKeyRef = useRef<(key: string) => void>(() => {});

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) handleKeyRef.current(e.key);
      else if (e.key === "Backspace") handleKeyRef.current("⌫");
      else if (e.key === "Enter") handleKeyRef.current("✓");
      else if (e.key === "-") handleKeyRef.current("−");
      else if (e.key === ".") handleKeyRef.current(".");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Core submit logic ─────────────────────────────────────────────────────────
  function submitAnswer(currentAnswer: string, timedOut = false) {
    const q = questions[currentIndex];
    const parsed = parseFloat(currentAnswer);
    const isCorrect = !timedOut && !isNaN(parsed) && parsed === q.answer;
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);

    setResults((prev) => [
      ...prev,
      {
        questionDisplay: q.display,
        correctAnswer: q.answer,
        userAnswerStr: currentAnswer,
        isCorrect,
        timeTaken: elapsed,
      },
    ]);
    setFeedback(isCorrect ? "correct" : "wrong");
  }

  // ── Keyboard key handler ──────────────────────────────────────────────────────
  const handleKey = useCallback(
    (key: string) => {
      if (phase !== "playing" || feedback !== "none") return;

      if (key === "⌫") {
        setAnswer((a) => a.slice(0, -1));
        return;
      }
      if (key === "✓") {
        submitAnswer(answer);
        return;
      }
      if (key === "−") {
        setAnswer((a) => (a.startsWith("−") ? a.slice(1) : "−" + a));
        return;
      }
      if (key === ".") {
        setAnswer((a) => (a.includes(".") ? a : a + "."));
        return;
      }
      // Digit key — limit to 8 chars
      if (answer.length < 8) {
        setAnswer((a) => a + key);
      }
    },
    [phase, feedback, answer] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Keep the ref in sync so the physical keyboard listener is always fresh
  handleKeyRef.current = handleKey;

  // ── Retry handler ─────────────────────────────────────────────────────────────
  function handleRetry() {
    const qs = generateQuestions(settings);
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswer("");
    setFeedback("none");
    setTimeRemaining(settings.timeLimitSeconds);
    setResults([]);
    setPhase("playing");
    questionStartTime.current = Date.now();
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      />
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        results={results}
        onRetry={handleRetry}
        onMenu={() => router.push("/")}
      />
    );
  }

  const question = questions[currentIndex];
  const isFeedback = feedback !== "none";

  // Overlay color during feedback
  const feedbackOverlay =
    feedback === "correct"
      ? "rgba(34, 197, 94, 0.12)"
      : feedback === "wrong"
      ? "rgba(239, 68, 68, 0.12)"
      : "transparent";

  return (
    <div
      className="h-full flex flex-col overflow-hidden transition-colors duration-200"
      style={{ background: `color-mix(in srgb, var(--bg-base), ${feedbackOverlay})` }}
    >
      {/* ── Header bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* Back button */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            router.push("/math");
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] active:text-white active:scale-90 transition-all"
        >
          ‹
        </button>

        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={[
                "rounded-full transition-all",
                i < currentIndex
                  ? "bg-emerald-500 w-2 h-2"
                  : i === currentIndex
                  ? "bg-blue-500 w-2.5 h-2.5"
                  : "bg-[var(--bg-elevated)] w-2 h-2",
              ].join(" ")}
            />
          ))}
        </div>

        {/* Timer display */}
        {settings.timeLimitSeconds > 0 ? (
          <div
            className={[
              "text-sm font-bold tabular-nums min-w-[2.5rem] text-right",
              timeRemaining <= 3 ? "text-red-400" : timeRemaining <= 6 ? "text-amber-400" : "text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {timeRemaining}s
          </div>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* ── Timer bar ── */}
      <TimerBar total={settings.timeLimitSeconds} remaining={timeRemaining} />

      {/* ── Question area ── */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 gap-4">

        {/* Question label */}
        <div
          className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest"
        >
          Question {currentIndex + 1} / {questions.length}
        </div>

        {/* Equation */}
        <div
          className={[
            "text-5xl font-black tracking-tight text-center leading-none transition-all",
            feedback === "correct"
              ? "text-emerald-400"
              : feedback === "wrong"
              ? "text-red-400"
              : "text-white",
          ].join(" ")}
        >
          {question.display}
        </div>

        {/* Feedback label */}
        {feedback !== "none" && (
          <div
            className={[
              "text-sm font-semibold",
              feedback === "correct" ? "text-emerald-400" : "text-red-400",
            ].join(" ")}
          >
            {feedback === "correct"
              ? "Correct!"
              : `Answer: ${question.answer}`}
          </div>
        )}

        {/* Answer display box */}
        <div
          className={[
            "w-full max-w-xs rounded-2xl px-5 py-3 flex items-center justify-end min-h-[56px] transition-all",
            feedback === "correct"
              ? "bg-emerald-950 border border-emerald-700"
              : feedback === "wrong"
              ? "bg-red-950 border border-red-700"
              : "bg-[var(--bg-surface)] border border-[var(--bg-elevated)]",
          ].join(" ")}
        >
          {answer === "" ? (
            <span className="text-[var(--text-muted)] text-2xl select-none">_</span>
          ) : (
            <span className="text-white text-3xl font-bold font-mono">{answer}</span>
          )}
        </div>
      </div>

      {/* ── Keyboard ── */}
      <div
        className="shrink-0"
        style={{ height: "52vh" }}
      >
        <NumberKeyboard onKey={handleKey} disabled={isFeedback} />
      </div>
    </div>
  );
}
