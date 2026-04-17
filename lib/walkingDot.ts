/**
 * Walking Dot (เดินจุด) module — types, settings, and question generation.
 * Uses the math question pool from lib/math.ts.
 */

import { generateQuestions, type Operation, type Question } from "./math";

export type WalkDotOp = "add" | "sub" | "mul" | "div" | "addSub";

export interface WalkingDotSettings {
  /** Session length in seconds. 0 = random & hidden to create pressure. */
  sessionSeconds: number;
  operations: WalkDotOp[];
  minDigits: number;
  maxDigits: number;
  /** How often math questions pop up during the session. */
  questionFrequency: "low" | "medium" | "high";
  /** Starting BPM (and constant BPM if mode is 'constant'). */
  minBpm: number;
  /** Target BPM when mode is 'gradual'. Same as minBpm if 'constant'. */
  maxBpm: number;
  bpmMode: "constant" | "gradual";
  /** Read each question aloud via TTS. */
  readAloud: boolean;
  /** Accept spoken number answers via STT. */
  voiceAnswer: boolean;
}

export const DEFAULT_WD_SETTINGS: WalkingDotSettings = {
  sessionSeconds: 120,
  operations: ["add", "sub"],
  minDigits: 1,
  maxDigits: 2,
  questionFrequency: "medium",
  minBpm: 80,
  maxBpm: 80,
  bpmMode: "constant",
  readAloud: true,
  voiceAnswer: false,
};

export const WD_SETTINGS_KEY = "pilotPrep_walkingDotSettings";

/** Milliseconds between question appearances for each frequency level (randomised within range). */
export function questionIntervalMs(
  freq: WalkingDotSettings["questionFrequency"]
): number {
  const ranges: Record<typeof freq, [number, number]> = {
    low: [22000, 36000],
    medium: [12000, 22000],
    high: [6000, 13000],
  };
  const [min, max] = ranges[freq];
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Pick a random hidden session duration (90 – 300 s). */
export function randomSessionSeconds(): number {
  return Math.floor(Math.random() * 211) + 90;
}

/** Pre-generate a large pool of questions so we never block mid-session. */
export function generateWdPool(settings: WalkingDotSettings): Question[] {
  return generateQuestions({
    timeLimitSeconds: 0,
    questionCount: 60,
    minDigits: settings.minDigits,
    maxDigits: settings.maxDigits,
    operations: settings.operations as Operation[],
  });
}

/** Play a metronome click using Web Audio API. */
export function playMetronomeClick(
  audioCtx: AudioContext,
  isAccent: boolean
): void {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.value = isAccent ? 1400 : 900;
  gain.gain.setValueAtTime(isAccent ? 0.3 : 0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.start(now);
  osc.stop(now + 0.06);
}
