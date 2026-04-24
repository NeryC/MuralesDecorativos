import type { MuralesStats } from "@/lib/queries/murales";

interface StatsBarProps {
  stats: MuralesStats;
}

const items = [
  { key: "total", label: "Total", color: "text-foreground" },
  { key: "aprobados", label: "Aprobados", color: "text-success" },
  { key: "pendientes", label: "Pendientes", color: "text-warning" },
  { key: "modificados", label: "Modificados", color: "text-accent" },
] as const;

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="w-full border-b bg-card">
      <div className="mx-auto grid grid-cols-4 gap-0 px-4 md:px-6">
        {items.map((item, idx) => (
          <div
            key={item.key}
            className={`flex flex-col items-center justify-center py-3 md:py-4 ${
              idx > 0 ? "border-l" : ""
            }`}
          >
            <span className={`text-xl md:text-2xl font-semibold tabular-nums ${item.color}`}>
              {stats[item.key]}
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
