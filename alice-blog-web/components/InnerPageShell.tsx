import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { siteConfig } from "@/siteConfig";

/**
 * Shared frame for every public inner page. The blurred wallpaper is mounted
 * once in the root layout; this shell adds a single acrylic content panel and
 * a permanent, explicit way back to the menu.
 */
export default function InnerPageShell({
  children,
  size = "default",
}: {
  children: ReactNode;
  size?: "default" | "wide";
}) {
  const pageWidth = size === "wide" ? "max-w-7xl" : "max-w-6xl";

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="mx-auto flex w-[95%] max-w-6xl items-center justify-between gap-3 py-4">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-sm font-bold text-slate-200 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-200"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          返回菜单
        </Link>

        <Link
          href="/"
          className="truncate text-sm font-black tracking-wide text-slate-200 transition-colors duration-200 hover:text-cyan-200"
        >
          {siteConfig.navTitle}
          <span className="mx-1 text-cyan-300">{siteConfig.navSuffix}</span>
          {siteConfig.navAfter}
        </Link>

        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-200"
        >
          GitHub
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </header>

      <main className={`mx-auto w-[95%] ${pageWidth} flex-1 pb-8`}>
        <div className="acrylic-panel acrylic-panel--inner p-4 sm:p-6 lg:p-8">
          <div className="inner-page">{children}</div>
        </div>
      </main>

      <footer className="mx-auto flex w-[95%] max-w-6xl flex-wrap items-center justify-between gap-3 py-5 text-[11px] text-slate-500">
        <span>
          © {new Date().getFullYear()} {siteConfig.authorName} · 保持好奇，持续构建
        </span>
        <nav aria-label="页脚导航" className="flex items-center gap-4">
          <Link href="/" className="transition-colors duration-200 hover:text-cyan-200">
            菜单
          </Link>
          <Link href="/about" className="transition-colors duration-200 hover:text-cyan-200">
            关于
          </Link>
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-200 hover:text-cyan-200"
          >
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  );
}
