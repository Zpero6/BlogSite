import Link from "next/link";
import Image from "next/image";
import { ExternalLink, GitBranch } from "lucide-react";
import { siteConfig } from "@/siteConfig";

const focusTags = ["Java 21", "Spring Cloud", "Redis", "AI 应用"];

export default function IdentityPanel() {
  return (
    <section
      className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5"
      aria-labelledby="identity-name"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 p-1 sm:h-[72px] sm:w-[72px]">
          <Image
            src={siteConfig.avatarUrl}
            alt={`${siteConfig.authorName} 的头像`}
            width={72}
            height={72}
            priority
            className="h-full w-full rounded-xl object-cover"
          />
        </div>

        <div className="min-w-0">
          <h1 id="identity-name" className="truncate text-2xl font-black tracking-tight text-white">
            {siteConfig.authorName}
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Java Backend · AI
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{siteConfig.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {focusTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[11px] font-bold text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4">
        <a
          href={siteConfig.social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-300"
        >
          <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
          Zpero6
          <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
        </a>
        <Link
          href="/about"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors duration-200 hover:text-cyan-300"
        >
          关于我
        </Link>
      </div>
    </section>
  );
}
