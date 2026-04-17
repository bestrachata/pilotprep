/**
 * Question generation for all 6 math operations.
 * All operations produce integer answers to keep the game fair and fast.
 */

export type Operation = "add" | "sub" | "mul" | "div" | "exp" | "sqrt" | "addSub";

export interface Question {
  /** Rendered display string, e.g. "47 × 8 =" */
  display: string;
  answer: number;
  operation: Operation;
}

export interface MathSettings {
  timeLimitSeconds: number; // 0 = no limit
  questionCount: number;
  minDigits: number;
  maxDigits: number;
  operations: Operation[];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random number within the digit range [minDigits, maxDigits]. */
function randomOperand(minDigits: number, maxDigits: number): number {
  const digits = randomInt(minDigits, maxDigits);
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max);
}

function makeAddition(minD: number, maxD: number): Question {
  const a = randomOperand(minD, maxD);
  const b = randomOperand(minD, maxD);
  return { display: `${a} + ${b} =`, answer: a + b, operation: "add" };
}

function makeSubtraction(minD: number, maxD: number): Question {
  const a = randomOperand(minD, maxD);
  const b = randomOperand(minD, maxD);
  const [big, small] = a >= b ? [a, b] : [b, a];
  return { display: `${big} − ${small} =`, answer: big - small, operation: "sub" };
}

function makeMultiplication(minD: number, maxD: number): Question {
  const a = randomOperand(minD, maxD);
  const b = randomOperand(minD, maxD);
  return { display: `${a} × ${b} =`, answer: a * b, operation: "mul" };
}

function makeDivision(minD: number, maxD: number): Question {
  // Build dividend from quotient × divisor so answer is always a whole number.
  const quotient = randomOperand(minD, maxD);
  // Keep divisor between 2 and 9 to stay reasonable
  const divisor = randomInt(2, 9);
  const dividend = quotient * divisor;
  return {
    display: `${dividend} ÷ ${divisor} =`,
    answer: quotient,
    operation: "div",
  };
}

function makeExponent(): Question {
  const base = randomInt(2, 9);
  const power = randomInt(2, 3);
  // Unicode superscripts ² and ³ render naturally without special markup
  const sup = power === 2 ? "²" : "³";
  return {
    display: `${base}${sup} =`,
    answer: Math.pow(base, power),
    operation: "exp",
  };
}

function makeSqrt(maxD: number): Question {
  // Pick a perfect square ≤ max value for the digit range so answer is integer
  const maxVal = Math.pow(10, maxD) - 1;
  const maxBase = Math.min(Math.floor(Math.sqrt(maxVal)), 30);
  const base = randomInt(2, Math.max(2, maxBase));
  return {
    display: `√${base * base} =`,
    answer: base,
    operation: "sqrt",
  };
}

/** a + b − c where answer is always > 0 (two-step challenge). */
function makeAddSub(minD: number, maxD: number): Question {
  const a = randomOperand(minD, maxD);
  const b = randomOperand(minD, maxD);
  const maxC = Math.min(a + b - 1, Math.pow(10, maxD) - 1);
  const c = randomInt(1, Math.max(1, maxC));
  return {
    display: `${a} + ${b} − ${c} =`,
    answer: a + b - c,
    operation: "addSub",
  };
}

function generateOne(settings: MathSettings): Question {
  const { operations, minDigits, maxDigits } = settings;
  const op = operations[Math.floor(Math.random() * operations.length)];

  switch (op) {
    case "add":
      return makeAddition(minDigits, maxDigits);
    case "sub":
      return makeSubtraction(minDigits, maxDigits);
    case "mul":
      return makeMultiplication(minDigits, maxDigits);
    case "div":
      return makeDivision(minDigits, maxDigits);
    case "exp":
      return makeExponent();
    case "sqrt":
      return makeSqrt(maxDigits);
    case "addSub":
      return makeAddSub(minDigits, maxDigits);
  }
}

/** Generates a full set of questions for a session. */
export function generateQuestions(settings: MathSettings): Question[] {
  return Array.from({ length: settings.questionCount }, () =>
    generateOne(settings)
  );
}

/** Default settings for a new session. */
export const DEFAULT_SETTINGS: MathSettings = {
  timeLimitSeconds: 10,
  questionCount: 10,
  minDigits: 1,
  maxDigits: 2,
  operations: ["add", "sub", "mul", "div"],
};

export const SETTINGS_KEY = "pilotPrep_mathSettings";
