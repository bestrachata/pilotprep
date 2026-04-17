"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NumberKeyboard from "@/components/NumberKeyboard";
import TimerBar from "@/components/TimerBar";
import {
  displayToSpeech,
  speak,
  startListening,
  stopSpeaking,
  type SttSession,
} from "@/lib/speech";
import {
  DEFAULT_WD_SETTINGS,
  WD_SETTINGS_KEY,
  generateWdPool,
  playMetronomeClick,
  questionIntervalMs,
  randomSessionSeconds,
  type WalkingDotSettings,
} from "@/lib/walkingDot";
import type { Question } from "@/lib/math";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "ready" | "active" | "done";
type QFeedback = "none" | "correct" | "wrong";

interface QuestionResult {
  questionDisplay: string;
  correctAnswer: number;
  userAnswerStr: string;
  isCorrect: boolean;
}

// ─── Results screen ────────────────────────────────────────────────────────────

function Results({
  results,
  elapsed,
  onRetry,
  onMenu,
}: {
  results: QuestionResult[];
  elapsed: number;
  onRetry: () => void;
  onMenu: () => void;
}) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const wrong = results.filter((r) => !r.isCorrect);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="shrink-0 flex flex-col items-center pt-8 pb-3 px-4">
        <div className={`text-6xl font-black mb-1 ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
          {total === 0 ? "—" : `${pct}%`}
        </div>
        <div className="text-[var(--text-secondary)] text-sm">
          {correct} / {total} correct · {mins}:{String(secs).padStart(2, "0")} session
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 overflow-hidden flex flex-col">
        {wrong.length === 0 && total > 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-4xl">🎯</div>
            <div className="text-emerald-400 font-semibold">Perfect score!</div>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-[var(--text-muted)] text-sm">No questions appeared this session.</div>
          </div>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Missed questions
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {wrong.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-[var(--bg-card)] rounded-xl px-4 py-2.5">
                  <span className="text-sm font-mono text-[var(--text-secondary)]">{r.questionDisplay}</span>
                  <div className="flex items-center gap-2 text-sm">
                    {r.userAnswerStr ? (
                      <span className="text-red-400 line-through font-mono">{r.userAnswerStr}</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                    <span className="text-emerald-400 font-bold font-mono">{r.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 flex gap-3 px-4 pt-3 pb-6">
        <button
          onPointerDown={(e) => { e.preventDefault(); onMenu(); }}
          className="flex-1 py-4 rounded-2xl bg-[var(--bg-card)] text-[var(--text-secondary)] font-semibold active:scale-95 transition-all"
        >
          Menu
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); onRetry(); }}
          className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Main session page ─────────────────────────────────────────────────────────

export default function WalkingDotPlayPage() {
  const router = useRouter();

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("loading");
  const [settings, setSettings] = useState<WalkingDotSettings>(DEFAULT_WD_SETTINGS);
  const [remaining, setRemaining] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(80);
  const [beatActive, setBeatActive] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [qFeedback, setQFeedback] = useState<QFeedback>("none");
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Stable refs (used in async callbacks to avoid stale closures) ─────────────
  const isActiveRef = useRef(false);
  const settingsRef = useRef(settings);
  const currentBpmRef = useRef(80);
  const beatCountRef = useRef(0);
  const totalSecondsRef = useRef(0);
  const questionPoolRef = useRef<Question[]>([]);
  const questionIdxRef = useRef(0);
  const questionActiveRef = useRef(false);
  const questionAnswerRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sttRef = useRef<SttSession | null>(null);
  const elapsedRef = useRef(0);

  // Timer IDs
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metronomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionSpawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  settingsRef.current = settings;
  questionAnswerRef.current = questionAnswer;

  // ── Load settings on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(WD_SETTINGS_KEY);
    const s: WalkingDotSettings = saved ? JSON.parse(saved) : DEFAULT_WD_SETTINGS;
    settingsRef.current = s;
    setSettings(s);
    currentBpmRef.current = s.minBpm;
    setCurrentBpm(s.minBpm);
    setPhase("ready");
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopEverything();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Physical keyboard ─────────────────────────────────────────────────────────
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

  // ── Core helpers ──────────────────────────────────────────────────────────────

  function stopEverything() {
    isActiveRef.current = false;
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
    if (questionSpawnTimerRef.current) clearTimeout(questionSpawnTimerRef.current);
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    sttRef.current?.stop();
    sttRef.current = null;
    stopSpeaking();
    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close();
    }
  }

  function scheduleBeat() {
    if (!isActiveRef.current) return;
    const interval = Math.round(60000 / currentBpmRef.current);
    metronomeTimerRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;

      // Click sound
      if (audioCtxRef.current) {
        const isAccent = beatCountRef.current % 4 === 0;
        playMetronomeClick(audioCtxRef.current, isAccent);
      }

      beatCountRef.current += 1;
      setBeatActive(true);
      setBeatIndex(beatCountRef.current % 4);
      setTimeout(() => setBeatActive(false), 120);

      // Gradual BPM ramp: increase 1 BPM every 8 beats toward maxBpm
      const s = settingsRef.current;
      if (s.bpmMode === "gradual" && currentBpmRef.current < s.maxBpm && beatCountRef.current % 8 === 0) {
        const next = Math.min(currentBpmRef.current + 1, s.maxBpm);
        currentBpmRef.current = next;
        setCurrentBpm(next);
      }

      scheduleBeat();
    }, interval);
  }

  function nextQuestion() {
    if (!isActiveRef.current || questionActiveRef.current) return;
    const pool = questionPoolRef.current;
    if (pool.length === 0) return;
    const q = pool[questionIdxRef.current % pool.length];
    questionIdxRef.current += 1;

    questionActiveRef.current = true;
    setActiveQuestion(q);
    setQuestionAnswer("");
    setQFeedback("none");
    setIsListening(false);

    // Slide overlay in with a tiny delay so initial mount transition fires
    setTimeout(() => setQuestionVisible(true), 30);

    const s = settingsRef.current;

    // Read question aloud
    if (s.readAloud) {
      const speech = displayToSpeech(q.display);
      speak(speech, () => {
        // Start STT after TTS finishes (if enabled)
        if (s.voiceAnswer && isActiveRef.current) startVoiceListen(q);
      });
    } else if (s.voiceAnswer) {
      startVoiceListen(q);
    }

    // Auto-timeout: mark wrong if not answered in 10s
    questionTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current && questionActiveRef.current) {
        submitQuestionAnswer(q, questionAnswerRef.current, true);
      }
    }, 10000);
  }

  function startVoiceListen(q: Question) {
    setIsListening(true);
    sttRef.current = startListening(
      (num) => {
        sttRef.current = null;
        setIsListening(false);
        if (num !== null && isActiveRef.current && questionActiveRef.current) {
          const synthetic = String(num);
          setQuestionAnswer(synthetic);
          submitQuestionAnswer(q, synthetic, false);
        }
      },
      () => setIsListening(true)
    );
  }

  function submitQuestionAnswer(q: Question, answerStr: string, timedOut: boolean) {
    if (!questionActiveRef.current) return;
    questionActiveRef.current = false;

    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    sttRef.current?.stop();
    sttRef.current = null;
    setIsListening(false);
    stopSpeaking();

    const parsed = parseFloat(answerStr);
    const isCorrect = !timedOut && !isNaN(parsed) && parsed === q.answer;
    const fb: QFeedback = isCorrect ? "correct" : "wrong";

    setQFeedback(fb);
    setResults((prev) => [
      ...prev,
      {
        questionDisplay: q.display,
        correctAnswer: q.answer,
        userAnswerStr: answerStr,
        isCorrect,
      },
    ]);

    const delay = isCorrect ? 700 : 1100;
    feedbackTimerRef.current = setTimeout(() => {
      setQuestionVisible(false);
      setTimeout(() => {
        setActiveQuestion(null);
        setQFeedback("none");
        setQuestionAnswer("");
        // Schedule next question
        if (isActiveRef.current) {
          questionSpawnTimerRef.current = setTimeout(
            nextQuestion,
            questionIntervalMs(settingsRef.current.questionFrequency)
          );
        }
      }, 280); // wait for slide-out transition
    }, delay);
  }

  function endSession() {
    stopEverything();
    setElapsedSeconds(elapsedRef.current);
    setPhase("done");
  }

  // ── Start session (called on "Tap to Begin" button) ───────────────────────────
  function startSession() {
    const s = settingsRef.current;

    // Create AudioContext here (inside user gesture)
    try {
      audioCtxRef.current = new AudioContext();
    } catch {
      /* best effort */
    }

    const totalSecs =
      s.sessionSeconds === 0 ? randomSessionSeconds() : s.sessionSeconds;
    totalSecondsRef.current = totalSecs;
    elapsedRef.current = 0;
    currentBpmRef.current = s.minBpm;
    beatCountRef.current = 0;
    questionPoolRef.current = generateWdPool(s);
    questionIdxRef.current = 0;
    questionActiveRef.current = false;
    isActiveRef.current = true;

    setRemaining(totalSecs);
    setCurrentBpm(s.minBpm);
    setBeatIndex(0);
    setResults([]);
    setPhase("active");

    // Session countdown
    sessionTimerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setRemaining((prev) => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start metronome
    scheduleBeat();

    // Schedule first question
    questionSpawnTimerRef.current = setTimeout(
      nextQuestion,
      questionIntervalMs(s.questionFrequency)
    );
  }

  // ── Keyboard handler ──────────────────────────────────────────────────────────
  const handleKey = useCallback(
    (key: string) => {
      if (!questionActiveRef.current || qFeedback !== "none") return;

      // Stop STT when user starts typing
      if (sttRef.current) {
        sttRef.current.stop();
        sttRef.current = null;
        setIsListening(false);
      }

      const q = activeQuestion;
      if (!q) return;

      if (key === "⌫") {
        setQuestionAnswer((a) => a.slice(0, -1));
        return;
      }
      if (key === "✓") {
        submitQuestionAnswer(q, questionAnswerRef.current, false);
        return;
      }
      if (key === "−") {
        setQuestionAnswer((a) => (a.startsWith("−") ? a.slice(1) : "−" + a));
        return;
      }
      if (key === ".") {
        setQuestionAnswer((a) => (a.includes(".") ? a : a + "."));
        return;
      }
      if (questionAnswerRef.current.length < 8) {
        setQuestionAnswer((a) => a + key);
      }
    },
    [activeQuestion, qFeedback] // eslint-disable-line react-hooks/exhaustive-deps
  );
  handleKeyRef.current = handleKey;

  // ── Retry ────────────────────────────────────────────────────────────────────
  function retry() {
    stopEverything();
    setActiveQuestion(null);
    setQuestionVisible(false);
    setQFeedback("none");
    setQuestionAnswer("");
    setResults([]);
    isActiveRef.current = false;
    setPhase("ready");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return <div className="h-full" style={{ background: "var(--bg-base)" }} />;
  }

  if (phase === "done") {
    return (
      <Results
        results={results}
        elapsed={elapsedSeconds}
        onRetry={retry}
        onMenu={() => router.push("/multitask")}
      />
    );
  }

  if (phase === "ready") {
    const s = settings;
    const bpmLabel =
      s.bpmMode === "gradual"
        ? `${s.minBpm} → ${s.maxBpm} BPM`
        : `${s.minBpm} BPM`;
    const timeLabel =
      s.sessionSeconds === 0
        ? "? min (random)"
        : `${Math.floor(s.sessionSeconds / 60)}:${String(s.sessionSeconds % 60).padStart(2, "0")}`;

    return (
      <div
        className="h-full flex flex-col items-center justify-between overflow-hidden px-6 py-8"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="flex items-center gap-3 self-start">
          <button
            onPointerDown={(e) => { e.preventDefault(); router.back(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] active:scale-90 text-xl"
          >
            ‹
          </button>
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          {/* Metronome icon placeholder */}
          <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-600/40 flex items-center justify-center">
            <span className="text-3xl">♩</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-1">เดินจุด</h1>
            <p className="text-[var(--text-muted)] text-sm">Walking Dot</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {[
              ["Duration", timeLabel],
              ["Metronome", bpmLabel],
              ["Questions", `${s.questionFrequency} frequency`],
              ["Voice", [s.readAloud && "Read aloud", s.voiceAnswer && "Voice answer"].filter(Boolean).join(" · ") || "Off"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between bg-[var(--bg-card)] rounded-xl px-4 py-2.5">
                <span className="text-sm text-[var(--text-muted)]">{label}</span>
                <span className="text-sm text-white font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onPointerDown={(e) => { e.preventDefault(); startSession(); }}
          className="w-full py-5 rounded-2xl bg-blue-600 text-white text-xl font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/50"
        >
          Tap to Begin
        </button>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────────
  const isHidden = settings.sessionSeconds === 0;

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Status bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-surface)" }}
      >
        <button
          onPointerDown={(e) => { e.preventDefault(); endSession(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] active:text-white text-xl"
        >
          ‹
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-white">
            {isHidden ? "▮▮:▮▮" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
            {isHidden ? "Time hidden" : "Remaining"}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-emerald-400">
            {results.filter((r) => r.isCorrect).length}/{results.length}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Score</span>
        </div>
      </div>

      {/* Timer bar (only when timer is visible) */}
      {!isHidden && (
        <TimerBar total={settings.sessionSeconds} remaining={remaining} />
      )}

      {/* Metronome visual */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Pulsing circle */}
        <div
          key={beatCountRef.current}
          className={`w-28 h-28 rounded-full flex items-center justify-center ${beatActive ? "animate-beat" : ""}`}
          style={{
            background: "radial-gradient(circle, #3b82f680 0%, #1d4ed820 100%)",
            border: "2px solid #3b82f640",
          }}
        >
          <div
            className={`w-16 h-16 rounded-full transition-all duration-75 ${beatActive ? "bg-blue-400 scale-110" : "bg-blue-600/60"}`}
          />
        </div>

        {/* BPM */}
        <div className="text-center">
          <div className="text-5xl font-black text-white tabular-nums">{currentBpm}</div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">BPM</div>
        </div>

        {/* Beat dots (4/4) */}
        <div className="flex gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-75 ${
                beatIndex % 4 === i
                  ? "w-3.5 h-3.5 bg-blue-400"
                  : "w-2.5 h-2.5 bg-[var(--bg-elevated)]"
              }`}
            />
          ))}
        </div>

        {settings.bpmMode === "gradual" && (
          <div className="text-xs text-[var(--text-muted)]">
            {currentBpm} → {settings.maxBpm} BPM
          </div>
        )}
      </div>

      {/* Question overlay — slides up from bottom */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl transition-transform duration-300 ease-out"
        style={{
          height: "72vh",
          background: "var(--bg-surface)",
          transform: questionVisible ? "translateY(0)" : "translateY(100%)",
          borderTop: "1px solid #1f2d45",
        }}
      >
        {/* Question header */}
        <div className="shrink-0 px-6 pt-5 pb-2 flex flex-col items-center gap-2">
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Listening…
            </div>
          )}
          {/* Equation */}
          <div
            className={[
              "text-4xl font-black text-center leading-tight",
              qFeedback === "correct"
                ? "text-emerald-400"
                : qFeedback === "wrong"
                ? "text-red-400"
                : "text-white",
            ].join(" ")}
          >
            {activeQuestion?.display ?? ""}
          </div>
          {/* Feedback label */}
          {qFeedback !== "none" && (
            <div className={`text-sm font-semibold ${qFeedback === "correct" ? "text-emerald-400" : "text-red-400"}`}>
              {qFeedback === "correct" ? "Correct!" : `Answer: ${activeQuestion?.answer}`}
            </div>
          )}
          {/* Answer display */}
          <div
            className={[
              "w-full rounded-2xl px-5 py-2.5 flex items-center justify-end min-h-[48px] transition-all",
              qFeedback === "correct"
                ? "bg-emerald-950 border border-emerald-700"
                : qFeedback === "wrong"
                ? "bg-red-950 border border-red-700"
                : "bg-[var(--bg-card)] border border-[var(--bg-elevated)]",
            ].join(" ")}
          >
            {questionAnswer === "" ? (
              <span className="text-[var(--text-muted)] text-xl">_</span>
            ) : (
              <span className="text-white text-2xl font-bold font-mono">{questionAnswer}</span>
            )}
          </div>
        </div>

        {/* Keyboard */}
        <div className="flex-1 min-h-0">
          <NumberKeyboard onKey={handleKey} disabled={qFeedback !== "none"} />
        </div>
      </div>
    </div>
  );
}
