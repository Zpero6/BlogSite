import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { siteConfig } from "../siteConfig";

/**
 * Static inner-page bar. It deliberately does not listen to scroll or use
 * fixed positioning, so scrolling never causes a React update or re-composite.
 */
export default function Navbar() {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950/55">
      <div className="mx-auto flex h-14 w-[95%] max-w-6xl items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-bold text-slate-300 transition-colors duration-200 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          返回菜单
        </Link>

        <Link
          href="/"
          className="truncate text-sm font-black tracking-wide text-slate-100 transition-colors duration-200 hover:text-cyan-300"
        >
          {siteConfig.navTitle}
          <span className="mx-1 text-cyan-400">{siteConfig.navSuffix}</span>
          {siteConfig.navAfter}
        </Link>

        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-300"
        >
          GitHub
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
