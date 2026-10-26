import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  description: string;
  href: string;
  imageSrc?: string;
  imageAlt?: string;
  imageSize?: number;
  imagePosition?: string;
  icon?: LucideIcon;
  soon?: boolean;
};

const items: NavItem[] = [
  {
    title: "时间线",
    description: "文章归档与更新记录",
    href: "/timeline",
    imageSrc: "/images/nav/timeline.svg",
    imageAlt: "时间线贴纸",
  },
  {
    title: "项目",
    description: "开源项目与技术实验",
    href: "/projects",
    imageSrc: "/images/nav/projects.svg",
    imageAlt: "项目贴纸",
  },
  {
    title: "关于",
    description: "关于 Zpero 与这个站点",
    href: "/about",
    imageSrc: "/images/nav/about.svg",
    imageAlt: "关于贴纸",
  },
  {
    title: "杂谈",
    description: "开发札记与问题记录",
    href: "/chatter",
    imageSrc: "/images/nav/chatter.svg",
    imageAlt: "杂谈贴纸",
  },
  {
    title: "说说",
    description: "生活动态与灵感碎片",
    href: "/moments",
    imageSrc: "/images/nav/moments.svg",
    imageAlt: "说说贴纸",
  },
  {
    title: "照片墙",
    description: "记录与收藏的画面",
    href: "/photowall",
    imageSrc: "/images/nav/photowall.svg",
    imageAlt: "照片墙贴纸",
  },
  {
    title: "音乐馆",
    description: "播放列表与歌词",
    href: "/music",
    imageSrc: "/images/nav/music.svg",
    imageAlt: "音乐贴纸",
  },
  {
    title: "友链",
    description: "有趣灵魂的入口",
    href: "/friends",
    imageSrc: "/images/nav/friends.svg",
    imageAlt: "友链贴纸",
  },
  {
    title: "收藏",
    description: "规划中的内容收藏",
    href: "/soon/favorites",
    imageSrc: "/images/nav/favorites.svg",
    imageAlt: "收藏贴纸",
    soon: true,
  },
  {
    title: "通知",
    description: "规划中的消息中心",
    href: "/soon/notifications",
    imageSrc: "/images/nav/notifications.svg",
    imageAlt: "通知贴纸",
    soon: true,
  },
  {
    title: "个人中心",
    description: "规划中的账户入口",
    href: "/soon/account",
    imageSrc: "/images/nav/account.svg",
    imageAlt: "个人中心贴纸",
    soon: true,
  },
];

export default function NavigationGrid() {
  return (
    <section aria-labelledby="navigation-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="navigation-heading" className="text-base font-black text-slate-100">
          站点
        </h2>
        <span className="text-[11px] text-slate-400">常用入口</span>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const imageSize = item.imageSize ?? 56;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="acrylic-card group flex min-h-[108px] min-w-0 items-center gap-3 p-3.5 transition-[background-color,border-color] duration-200 hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-slate-100">
                    {item.title}
                  </span>
                  {item.soon && (
                    <span className="shrink-0 rounded-full border border-amber-200/15 bg-amber-300/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-amber-200/75">
                      规划中
                    </span>
                  )}
                </span>
                <span className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-400">
                  {item.description}
                </span>
              </span>

              {item.imageSrc ? (
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt || item.title}
                  width={imageSize}
                  height={imageSize}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    objectPosition: item.imagePosition,
                  }}
                  className="shrink-0 object-contain transition-transform duration-200 group-hover:translate-x-0.5"
                />
              ) : Icon ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-black text-slate-300"
                >
                  {item.title.slice(0, 1)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
