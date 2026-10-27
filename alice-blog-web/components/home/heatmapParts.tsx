import type { ContributionData } from "@/lib/githubContributions";

const LEVEL_CLASSES = [
  "bg-white/25 border border-white/15",
  "bg-[#c3efcc]/90",
  "bg-[#89dca0]",
  "bg-[#4cbb79]",
  "bg-[#258552]",
];

// A seeded pattern keeps the playful fill consistent between server rendering,
// hydration and refreshes. Actual contribution data is left untouched.
function decorativeLevel(date: string) {
  let seed = 2166136261;
  for (const character of `zpero-garden:${date}`) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  }
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x7feb352d);
  seed ^= seed >>> 15;
  seed = Math.imul(seed, 0x846ca68b);
  seed ^= seed >>> 16;
  const value = (seed >>> 0) / 4294967296;
  if (value < 0.6) return 0;
  if (value < 0.75) return 1;
  if (value < 0.88) return 2;
  if (value < 0.96) return 3;
  return 4;
}

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
        aria-label={`${data.username} 的绿色热力图，包含随机装饰填色`}
        className="heatmap-grid grid w-max grid-flow-col grid-rows-7"
      >
        {cells.map((day, index) =>
          day ? (
            <div
              key={day.date}
              role="listitem"
              aria-label={`${day.date}，${day.count} 次贡献`}
              title={`${day.date} · ${day.count} 次贡献`}
              className={`heatmap-cell rounded-[2px] ring-1 ring-black/15 transition-[box-shadow] duration-150 hover:ring-1 hover:ring-cyan-300/80 ${
                LEVEL_CLASSES[day.level > 0 ? day.level : decorativeLevel(day.date)] ?? LEVEL_CLASSES[0]
              }`}
            />
          ) : (
            <div key={`pad-${index}`} className="heatmap-cell" aria-hidden="true" />
          )
        )}
      </div>
    </div>
  );
}
