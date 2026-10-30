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
    <section className="flex flex-col gap-2.5" aria-labelledby="contribution-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="contribution-heading"
            className="text-shadow-strong text-[13px] font-semibold text-white/95"
          >
            GitHub 贡献
          </h2>
          <p className="mt-0.5 text-shadow-strong text-[11px] text-white/80">过去 365 天</p>
        </div>
        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-shadow-strong text-[11px] font-medium text-white/85 transition-colors duration-200 hover:text-white"
        >
          @{siteConfig.githubUsername}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="acrylic-strip flex flex-col items-start justify-between gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
        <p className="text-xs text-white/75" aria-live="polite">
          贡献数据暂时不可用：{result.error}
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/20 disabled:opacity-50"
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
