import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Clock,
  FolderKanban,
  Heart,
  Image,
  Link2,
  MessageSquare,
  Music,
  Sparkles,
  User,
} from "lucide-react";

type NavItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
};

const items: NavItem[] = [
  {
    title: "时间线",
    description: "文章归档与更新记录",
    href: "/timeline",
    icon: Clock,
  },
  {
    title: "项目",
    description: "开源项目与技术实验",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "关于",
    description: "关于 Zpero 与这个站点",
    href: "/about",
    icon: User,
  },
  {
    title: "杂谈",
    description: "开发札记与问题记录",
    href: "/chatter",
    icon: MessageSquare,
  },
  {
    title: "说说",
    description: "生活动态与灵感碎片",
    href: "/moments",
    icon: Sparkles,
  },
  {
    title: "照片墙",
    description: "记录与收藏的画面",
    href: "/photowall",
    icon: Image,
  },
  {
    title: "音乐馆",
    description: "播放列表与歌词",
    href: "/music",
    icon: Music,
  },
  {
    title: "友链",
    description: "有趣灵魂的入口",
    href: "/friends",
    icon: Link2,
  },
  {
    title: "收藏",
    description: "规划中的内容收藏",
    href: "/soon/favorites",
    icon: Heart,
    soon: true,
  },
  {
    title: "通知",
    description: "规划中的消息中心",
    href: "/soon/notifications",
    icon: Bell,
    soon: true,
  },
  {
    title: "个人中心",
    description: "规划中的账户入口",
    href: "/soon/account",
    icon: User,
    soon: true,
  },
];

export default function NavigationGrid() {
  return (
    <section aria-labelledby="navigation-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="navigation-heading" className="text-sm font-black tracking-widest text-slate-200">
            站点
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">选择要前往的模块</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-[360px]:grid-cols-1 sm:gap-2.5 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.065] sm:gap-3 sm:p-3.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/[0.08] text-cyan-300 sm:h-9 sm:w-9">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-black text-slate-200 transition-colors duration-200 group-hover:text-white sm:text-sm">
                    {item.title}
                  </span>
                  {item.soon && (
                    <>
                      <span className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10 px-1 py-0.5 text-[8px] font-black tracking-wider text-amber-200/80 sm:hidden">
                        规划
                      </span>
                      <span className="hidden shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-200/80 sm:inline">
                        规划中
                      </span>
                    </>
                  )}
                </span>
                <span className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">
                  {item.description}
                </span>
              </span>

              <ArrowRight
                className="hidden h-3.5 w-3.5 shrink-0 text-slate-600 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300 sm:block"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
