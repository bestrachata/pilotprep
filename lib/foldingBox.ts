/**
 * Folding Box (พับกล่อง) puzzle engine.
 *
 * Generates a random cube with 6 distinct face colors, then produces
 * one correct net and three wrong nets. Wrong nets always differ in at
 * least one face that is visible in the standard isometric 3D view
 * (top, front, right) so every puzzle is solvable from the shown image.
 *
 * Net layout (standard cross / plus shape):
 *
 *            [ top  ]
 *  [left] [front] [right] [back]
 *            [bottom]
 *
 * Grid positions (col, row):
 *   (2,0) top
 *   (0,1) left   (1,1) front  (2,1) right  (3,1) back
 *   (2,2) bottom
 */

// ─── Colors ────────────────────────────────────────────────────────────────────

// Six visually distinct face colors that read well on dark backgrounds
export const FACE_COLORS = [
  "#ef4444", // red
  "#60a5fa", // blue
  "#4ade80", // green
  "#facc15", // yellow
  "#fb923c", // orange
  "#c084fc", // purple
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BoxFaces {
  top: string;
  bottom: string;
  front: string;
  back: string;
  left: string;
  right: string;
}

/** A net cell uses the same face names as BoxFaces — just in flat layout. */
export type NetLayout = BoxFaces;

export interface NetChoice {
  net: NetLayout;
  isCorrect: boolean;
}

export interface FoldingBoxPuzzle {
  box: BoxFaces;
  choices: NetChoice[]; // always 4, shuffled
  correctIndex: number;
}

export interface FoldingBoxSettings {
  questionCount: number;
  timeLimitSeconds: number; // 0 = no limit
}

export const DEFAULT_FB_SETTINGS: FoldingBoxSettings = {
  questionCount: 10,
  timeLimitSeconds: 0,
};

export const FB_SETTINGS_KEY = "pilotPrep_foldingBoxSettings";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function netsEqual(a: NetLayout, b: NetLayout): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.front === b.front &&
    a.back === b.back &&
    a.left === b.left &&
    a.right === b.right
  );
}

// ─── Generation ────────────────────────────────────────────────────────────────

/** Assign 6 shuffled colors to the 6 cube faces. */
function generateBox(): BoxFaces {
  const [top, bottom, front, back, left, right] = shuffle([...FACE_COLORS]);
  return { top, bottom, front, back, left, right };
}

/** The correct net directly mirrors the box face assignment. */
function boxToNet(box: BoxFaces): NetLayout {
  return { ...box };
}

/**
 * Produce a wrong net by swapping exactly two face colors.
 * At least one of the swapped faces must be in {top, front, right}
 * (the three faces visible in the standard isometric view) so that
 * the error is always detectable without guessing.
 */
function makeWrongNet(correct: NetLayout): NetLayout {
  const VISIBLE: (keyof NetLayout)[] = ["top", "front", "right"];
  const ALL: (keyof NetLayout)[] = [
    "top", "bottom", "front", "back", "left", "right",
  ];

  const wrong = { ...correct };

  // Pick one visible face to swap
  const a = VISIBLE[Math.floor(Math.random() * VISIBLE.length)];
  // Pick any different face (can be hidden)
  let b: keyof NetLayout;
  do {
    b = ALL[Math.floor(Math.random() * ALL.length)];
  } while (b === a);

  const tmp = wrong[a];
  wrong[a] = wrong[b];
  wrong[b] = tmp;

  return wrong;
}

/** Generate a full puzzle: box + 4 shuffled choices (1 correct, 3 wrong). */
export function generatePuzzle(): FoldingBoxPuzzle {
  const box = generateBox();
  const correct = boxToNet(box);
  const wrongs: NetLayout[] = [];

  // Keep generating until we have 3 distinct wrong nets
  while (wrongs.length < 3) {
    const candidate = makeWrongNet(correct);
    const isDupe =
      netsEqual(candidate, correct) ||
      wrongs.some((w) => netsEqual(w, candidate));
    if (!isDupe) wrongs.push(candidate);
  }

  const choices: NetChoice[] = shuffle([
    { net: correct, isCorrect: true },
    ...wrongs.map((net) => ({ net, isCorrect: false })),
  ]);

  return {
    box,
    choices,
    correctIndex: choices.findIndex((c) => c.isCorrect),
  };
}

/** Pre-generate an array of puzzles for a full session. */
export function generatePuzzles(count: number): FoldingBoxPuzzle[] {
  return Array.from({ length: count }, generatePuzzle);
}
