import ModuleCard from "@/components/ModuleCard";

const MODULES = [
  {
    id: "math",
    title: "Mental Math",
    subtitle: "Arithmetic under pressure",
    symbol: "∑",
    active: true,
    href: "/math",
  },
  {
    id: "memory",
    title: "Short Memory",
    subtitle: "Sequential recall",
    symbol: "◈",
    active: false,
  },
  {
    id: "multitask",
    title: "Multi-tasking",
    subtitle: "Dual-task performance",
    symbol: "⊕",
    active: true,
    href: "/multitask",
  },
  {
    id: "spatial",
    title: "Spatial",
    subtitle: "Instrument interpretation",
    symbol: "⊙",
    active: false,
  },
  {
    id: "attention",
    title: "Attention",
    subtitle: "Divided focus tracking",
    symbol: "◎",
    active: false,
  },
  {
    id: "situational",
    title: "Situational",
    subtitle: "Awareness & decision",
    symbol: "△",
    active: false,
  },
];

export default function HomePage() {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div className="shrink-0 px-5 pt-safe-top pt-6 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-blue-500 text-xl">✈</span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            PILOT PREP
          </h1>
        </div>
        <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">
          By Rachata Suksereekul
        </p>
      </div>

      {/* Section label */}
      <div className="shrink-0 px-5 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Training Modules
        </span>
      </div>

      {/* Module grid — fills remaining space */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
          {MODULES.map((mod) => (
            <ModuleCard
              key={mod.id}
              title={mod.title}
              subtitle={mod.subtitle}
              symbol={mod.symbol}
              active={mod.active}
              href={mod.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
