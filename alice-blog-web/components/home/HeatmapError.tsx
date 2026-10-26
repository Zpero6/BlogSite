"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { ContributionData } from "@/lib/githubContributions";
import { siteConfig } from "@/siteConfig";
import ContributionHeatmap from "./ContributionHeatmap";

type RetryResult =
  | { ok: true; data: ContributionData }
  | { ok: false; error: string };

export default function HeatmapError({ initialError }: { initialError: string }) {
  const [result, setResult] = useState<RetryResult>({ ok: false, error: initialError });
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch("/api/contributions", { cache: "no-store" });
      const next = (await response.json()) as RetryResult;
      setResult(next);
    } catch {
      setResult({ ok: false, error: "重试失败，请稍后再试" });
    } finally {
      setIsRetrying(false);
    }
  };

  if (result.ok) {
    return <ContributionHeatmap data={result.data} />;
  }

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
          <p className="mt-0.5 text-[11px] text-slate-400">过去 365 天的公开贡献</p>
        </div>
        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-300"
        >
          @{siteConfig.githubUsername}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-4 py-4 sm:flex-row sm:items-center">
        <p className="text-sm text-amber-100/80" aria-live="polite">
          贡献数据暂时不可用：{result.error}
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors duration-200 hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isRetrying ? "重试中" : "重试"}
        </button>
      </div>
    </section>
  );
}
