import type { ContributionData } from "@/lib/githubContributions";
import { HeatmapGrid } from "./heatmapParts";

export default function ContributionHeatmap({ data }: { data: ContributionData }) {
  return (
    <section
      className="text-shadow-strong"
      aria-labelledby="contribution-heading"
    >
      <h2 id="contribution-heading" className="sr-only">
        GitHub 贡献，过去 365 天共 {data.total} 次
      </h2>

      {data.days.length > 0 ? (
        <HeatmapGrid data={data} />
      ) : (
        <div className="py-8 text-center text-sm text-white/70">
          近一年暂无公开贡献
        </div>
      )}
    </section>
  );
}
