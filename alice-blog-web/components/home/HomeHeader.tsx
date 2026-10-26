import { ExternalLink, GitBranch } from "lucide-react";
import { siteConfig } from "@/siteConfig";
import AnnouncementStrips from "./AnnouncementStrips";

export default function HomeHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`font-black leading-none tracking-tight text-white ${
              compact ? "text-[2.6rem]" : "text-[3rem] sm:text-[3.6rem]"
            }`}
          >
            <span className="brand-display">Zpero</span>
            <span className="ml-2 text-[0.55em] font-black tracking-normal text-cyan-200">
              の 小站
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Java 后端、分布式系统与 AI 应用的持续记录。选一个入口，继续探索。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            在线
          </span>
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-200"
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            GitHub
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
          </a>
        </div>
      </div>

      <AnnouncementStrips />
    </header>
  );
}
