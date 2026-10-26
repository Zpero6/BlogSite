import { ExternalLink } from "lucide-react";
import type { ContributionData } from "@/lib/githubContributions";
import { HeatmapGrid, Legend } from "./heatmapParts";

export default function ContributionHeatmap({ data }: { data: ContributionData }) {
  return (
    <section
      className="acrylic-panel p-4 sm:p-5"
      aria-labelledby="contribution-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="contribution-heading" className="text-sm font-black text-slate-100">
            GitHub 贡献
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            过去 365 天的公开贡献 · 共 {data.total} 次
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Legend />
          <a
            href={`https://github.com/${data.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-300"
          >
            @{data.username}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>

      {data.days.length > 0 ? (
        <HeatmapGrid data={data} />
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
          近一年暂无公开贡献
        </div>
      )}
    </section>
  );
}
