/**
 * Speech utilities — TTS (text-to-speech) and STT (speech-to-text).
 * Uses the Web Speech API. Gracefully degrades when unavailable (SSR, unsupported browsers).
 */

/** Convert a math equation display string into natural spoken English. */
export function displayToSpeech(display: string): string {
  return display
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/²/g, " squared ")
    .replace(/³/g, " cubed ")
    .replace(/√/g, "square root of ")
    .replace(/=/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Speak text via TTS. Cancels any current utterance first. */
export function speak(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

/** Cancel any in-progress TTS. */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Returns true if the current browser supports SpeechRecognition. */
export function isSttAvailable(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface SttSession {
  stop(): void;
}

/** Try to parse spoken text as a number. Handles digits and "minus X" forms. */
function parseSpokenNumber(text: string): number | null {
  const cleaned = text.trim().toLowerCase().replace(/,/g, "");
  const direct = parseFloat(cleaned);
  if (!isNaN(direct)) return direct;

  const negMatch = cleaned.match(/^(minus|negative)\s+([\d.]+)$/);
  if (negMatch) {
    const n = parseFloat(negMatch[2]);
    if (!isNaN(n)) return -n;
  }
  return null;
}

/**
 * Start a speech recognition session.
 * onResult fires with the parsed number or null if speech was unintelligible.
 * Returns a session handle (to stop early) or null if STT is unavailable.
 */
export function startListening(
  onResult: (num: number | null) => void,
  onStart?: () => void
): SttSession | null {
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;
  recognition.continuous = false;

  recognition.onstart = () => onStart?.();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    const results = event.results[0];
    for (let i = 0; i < results.length; i++) {
      const transcript: string = results[i].transcript;
      const num = parseSpokenNumber(transcript);
      if (num !== null) {
        onResult(num);
        return;
      }
    }
    onResult(null);
  };

  recognition.onerror = () => onResult(null);
  recognition.onend = () => onResult(null);

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop() {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
