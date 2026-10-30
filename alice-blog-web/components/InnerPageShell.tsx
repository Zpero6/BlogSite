import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { siteConfig } from "@/siteConfig";
import AccountMenu from "@/components/account/AccountMenu";

/**
 * Shared frame for every public inner page. The blurred wallpaper is mounted
 * once in the root layout; this shell adds a single frosted content panel and
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
      <header className="mx-auto flex w-[92%] max-w-6xl items-center justify-between gap-3 py-4">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 transition-colors duration-200 hover:border-white/30 hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          返回菜单
        </Link>

        <Link
          href="/"
          className="text-shadow-strong truncate text-sm font-semibold tracking-wide text-white/90 transition-colors duration-200 hover:text-white"
        >
          {siteConfig.navTitle}
          <span className="mx-1">{siteConfig.navSuffix}</span>
          {siteConfig.navAfter}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <AccountMenu />
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 transition-colors duration-200 hover:border-white/30 hover:bg-white/20 hover:text-white sm:inline-flex"
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className={`mx-auto w-[92%] ${pageWidth} flex-1 pb-8`}>
        <div className="acrylic-panel acrylic-panel--inner p-4 sm:p-6 lg:p-8">
          <div className="inner-page">{children}</div>
        </div>
      </main>

      <footer className="mx-auto flex w-[92%] max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 py-5 text-center text-[11px] text-shadow-strong text-white/65">
        <span>
          © {new Date().getFullYear()} {siteConfig.authorName}
        </span>
        <Link href="/" className="transition-colors duration-200 hover:text-white">
          菜单
        </Link>
        <Link href="/about" className="transition-colors duration-200 hover:text-white">
          关于
        </Link>
        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-200 hover:text-white"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
