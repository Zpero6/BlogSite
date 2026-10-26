import type { ContributionData } from "@/lib/githubContributions";

const LEVEL_CLASSES = [
  "bg-white/[0.06] border border-white/[0.05]",
  "bg-cyan-950",
  "bg-cyan-800",
  "bg-cyan-600",
  "bg-emerald-400",
];

function buildCells(days: ContributionData["days"]) {
  if (days.length === 0) return [];

  const firstDay = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const leading = Array.from({ length: firstDay }, () => null);
  return [...leading, ...days];
}

export function HeatmapGrid({ data }: { data: ContributionData }) {
  const cells = buildCells(data.days);

  return (
    <div className="overflow-x-auto pb-1">
      <div
        role="list"
        aria-label={`${data.username} 近一年的 GitHub 贡献热力图，共 ${data.total} 次贡献`}
        className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
        style={{ gridAutoColumns: "11px" }}
      >
        {cells.map((day, index) =>
          day ? (
            <div
              key={day.date}
              role="listitem"
              aria-label={`${day.date}，${day.count} 次贡献`}
              title={`${day.date} · ${day.count} 次贡献`}
              className={`h-[11px] w-[11px] rounded-[2px] transition-[box-shadow] duration-150 hover:ring-1 hover:ring-cyan-300/80 ${
                LEVEL_CLASSES[day.level] ?? LEVEL_CLASSES[0]
              }`}
            />
          ) : (
            <div key={`pad-${index}`} className="h-[11px] w-[11px]" aria-hidden="true" />
          )
        )}
      </div>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-400" aria-hidden="true">
      <span>少</span>
      {LEVEL_CLASSES.map((className, index) => (
        <span key={index} className={`h-[10px] w-[10px] rounded-[2px] ${className}`} />
      ))}
      <span>多</span>
    </div>
  );
}
