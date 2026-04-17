import Link from "next/link";

interface ModuleCardProps {
  title: string;
  subtitle: string;
  symbol: string;
  active: boolean;
  href?: string;
}

export default function ModuleCard({
  title,
  subtitle,
  symbol,
  active,
  href,
}: ModuleCardProps) {
  const inner = (
    <div
      className={[
        "relative flex flex-col h-full rounded-2xl p-4 overflow-hidden transition-all",
        active
          ? "bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/50 active:scale-95"
          : "bg-[var(--bg-card)] opacity-60",
      ].join(" ")}
    >
      {/* Symbol */}
      <div
        className={[
          "text-3xl font-bold mb-2 leading-none",
          active ? "text-white" : "text-[var(--text-muted)]",
        ].join(" ")}
      >
        {symbol}
      </div>

      {/* Title */}
      <div
        className={[
          "text-base font-semibold leading-tight",
          active ? "text-white" : "text-[var(--text-secondary)]",
        ].join(" ")}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        className={[
          "text-xs mt-0.5",
          active ? "text-blue-200" : "text-[var(--text-muted)]",
        ].join(" ")}
      >
        {subtitle}
      </div>

      {/* Coming soon badge */}
      {!active && (
        <div className="absolute top-3 right-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
          Soon
        </div>
      )}

      {/* Active arrow indicator */}
      {active && (
        <div className="absolute bottom-3 right-3 text-blue-200 text-lg">
          →
        </div>
      )}
    </div>
  );

  if (active && href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }

  return <div className="h-full cursor-not-allowed">{inner}</div>;
}
