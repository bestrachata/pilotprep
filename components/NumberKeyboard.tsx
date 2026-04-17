"use client";

/**
 * Full-screen custom numeric keyboard.
 * No real <input> — drives parent state via onKey callback.
 * Keys: 0–9, − (negative), . (decimal), ⌫ (backspace), ✓ (submit)
 */

interface NumberKeyboardProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

// Key layout: 4 standard rows + 1 full-width submit row
const ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["−", "0", "⌫"],
];

export default function NumberKeyboard({ onKey, disabled = false }: NumberKeyboardProps) {
  function press(key: string) {
    if (!disabled) onKey(key);
  }

  return (
    <div
      className="grid gap-[3px] p-[3px] bg-[var(--bg-base)]"
      style={{ gridTemplateRows: "repeat(5, 1fr)", height: "100%" }}
    >
      {/* Rows 1-4 */}
      {ROWS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-[3px]">
          {row.map((key) => {
            const isBack = key === "⌫";
            const isMinus = key === "−";
            return (
              <button
                key={key}
                onPointerDown={(e) => {
                  e.preventDefault();
                  press(key);
                }}
                className={[
                  "flex items-center justify-center rounded-xl text-2xl font-semibold select-none transition-all active:scale-95",
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer",
                  isBack
                    ? "bg-[#2a1515] text-red-400"
                    : isMinus
                    ? "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-primary)]",
                ].join(" ")}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}

      {/* Row 5: full-width submit */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          press("✓");
        }}
        className={[
          "flex items-center justify-center rounded-xl text-2xl font-bold select-none transition-all active:scale-95",
          disabled
            ? "bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed opacity-40"
            : "bg-emerald-600 text-white cursor-pointer",
        ].join(" ")}
      >
        ✓ Submit
      </button>
    </div>
  );
}
