/**
 * Thin countdown bar displayed below the session header.
 * Color transitions blue → amber → red as time runs out.
 */

interface TimerBarProps {
  total: number; // total seconds (0 = no limit, hides bar)
  remaining: number; // seconds remaining
}

export default function TimerBar({ total, remaining }: TimerBarProps) {
  if (total === 0) return null;

  const pct = Math.max(0, (remaining / total) * 100);

  let barColor = "#3b82f6"; // blue
  if (pct <= 30) barColor = "#ef4444"; // red
  else if (pct <= 55) barColor = "#f59e0b"; // amber

  return (
    <div className="h-1 w-full bg-[var(--bg-elevated)] shrink-0">
      <div
        className="h-full transition-all duration-1000 ease-linear rounded-full"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  );
}
