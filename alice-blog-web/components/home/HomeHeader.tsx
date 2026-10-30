import Link from "next/link";
import {
  Clock,
  FolderKanban,
  GitBranch,
  Smile,
  User,
} from "lucide-react";
import { siteConfig } from "@/siteConfig";
import AnnouncementStrips from "./AnnouncementStrips";
import AccountMenu from "@/components/account/AccountMenu";

export default function HomeHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`flex flex-col ${compact ? "gap-4" : "gap-5"}`}>
      <div>
        <h1
          className={`text-shadow-soft font-black leading-[1.02] tracking-[-0.035em] text-white ${
            compact
              ? "text-[2.3rem]"
              : "text-[clamp(2.25rem,3.2vw,3rem)]"
          }`}
        >
          {siteConfig.navTitle}
          <span className="mx-2 text-[0.9em]">{siteConfig.navSuffix}</span>
          {siteConfig.navAfter}
        </h1>

        <div className="mt-3 inline-flex flex-wrap items-center gap-2.5 rounded-full bg-[rgba(20,35,45,0.25)] px-3 py-1.5 text-sm">
          <Smile
            className="h-4 w-4 text-[var(--status-mint)]"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span className="text-shadow-strong font-medium text-white/90">
            小站当前访问状态
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/25 bg-emerald-300/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-mint)]" />
            正常运行
          </span>
        </div>
      </div>

      <AnnouncementStrips />

      <nav
        className="flex flex-wrap items-center gap-2"
        aria-label="快捷入口"
      >
        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          aria-label="GitHub"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 bg-[rgba(20,35,45,0.32)] text-white/90 transition-colors duration-200 hover:border-white/35 hover:bg-[rgba(32,50,60,0.48)] hover:text-white"
        >
          <GitBranch className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
        <Link
          href="/about"
          title="关于"
          aria-label="关于"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 bg-[rgba(20,35,45,0.32)] text-white/90 transition-colors duration-200 hover:border-white/35 hover:bg-[rgba(32,50,60,0.48)] hover:text-white"
        >
          <User className="h-[18px] w-[18px]" aria-hidden="true" />
        </Link>
        <Link
          href="/timeline"
          title="时间线"
          aria-label="时间线"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 bg-[rgba(20,35,45,0.32)] text-white/90 transition-colors duration-200 hover:border-white/35 hover:bg-[rgba(32,50,60,0.48)] hover:text-white"
        >
          <Clock className="h-[18px] w-[18px]" aria-hidden="true" />
        </Link>
        <Link
          href="/projects"
          title="项目"
          aria-label="项目"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 bg-[rgba(20,35,45,0.32)] text-white/90 transition-colors duration-200 hover:border-white/35 hover:bg-[rgba(32,50,60,0.48)] hover:text-white"
        >
          <FolderKanban className="h-[18px] w-[18px]" aria-hidden="true" />
        </Link>
        <span className="ml-1">
          <AccountMenu />
        </span>
      </nav>
    </header>
  );
}
