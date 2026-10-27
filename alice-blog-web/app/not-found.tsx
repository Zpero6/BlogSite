import Link from "next/link";
import InnerPageShell from "@/components/InnerPageShell";
import { siteConfig } from "@/siteConfig";

export default function NotFound() {
  return (
    <InnerPageShell>
      <div className="mx-auto max-w-xl py-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-100/70">404</p>
        <h1 className="text-shadow-strong mt-3 text-3xl font-bold text-white">页面不存在</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          这篇文章可能尚未发布、已被移除，或者地址有误。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/timeline"
            className="inline-flex rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-100/25"
          >
            浏览时间线
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-[10px] border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            返回 {siteConfig.navTitle}
            {siteConfig.navSuffix}
            {siteConfig.navAfter}
          </Link>
        </div>
      </div>
    </InnerPageShell>
  );
}
