import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

type NavItem = {
  title: string;
  description: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  imageSize?: number;
  imagePosition?: string;
  soon?: boolean;
};

const items: NavItem[] = [
  {
    title: "时间线",
    description: "按日期翻看文章",
    href: "/timeline",
    imageSrc: "/images/nav/timeline.svg",
    imageAlt: "时间线图标",
  },
  {
    title: "项目",
    description: "代码、架构与实验",
    href: "/projects",
    imageSrc: "/images/nav/projects.svg",
    imageAlt: "项目图标",
  },
  {
    title: "关于",
    description: "我的技术与日常",
    href: "/about",
    imageSrc: "/images/nav/about.svg",
    imageAlt: "关于图标",
  },
  {
    title: "杂谈",
    description: "踩坑、复盘和随记",
    href: "/chatter",
    imageSrc: "/images/nav/chatter.svg",
    imageAlt: "杂谈图标",
  },
  {
    title: "说说",
    description: "不成篇的生活碎片",
    href: "/moments",
    imageSrc: "/images/nav/moments.svg",
    imageAlt: "说说图标",
  },
  {
    title: "照片墙",
    description: "旅途、屏幕和收藏",
    href: "/photowall",
    imageSrc: "/images/nav/photowall.svg",
    imageAlt: "照片墙图标",
  },
  {
    title: "音乐馆",
    description: "最近循环的声音",
    href: "/music",
    imageSrc: "/images/nav/music.svg",
    imageAlt: "音乐图标",
  },
  {
    title: "友链",
    description: "我常去的站点",
    href: "/friends",
    imageSrc: "/images/nav/friends.svg",
    imageAlt: "友链图标",
  },
  {
    title: "收藏",
    description: "登录后收藏的文章",
    href: "/favorites",
    imageSrc: "/images/nav/favorites.svg",
    imageAlt: "收藏图标",
  },
  {
    title: "通知",
    description: "新文章发布提醒",
    href: "/notifications",
    imageSrc: "/images/nav/notifications.svg",
    imageAlt: "通知图标",
  },
  {
    title: "个人中心",
    description: "登录、账户与管理入口",
    href: "/account",
    imageSrc: "/images/nav/account.svg",
    imageAlt: "个人中心图标",
  },
];

export default function NavigationGrid() {
  return (
    <section aria-labelledby="navigation-heading">
      <h2
        id="navigation-heading"
        className="text-shadow-strong mb-3.5 flex items-center gap-2 text-[1.5rem] font-bold text-white"
      >
        <LayoutGrid className="h-5 w-5 text-white/85" aria-hidden="true" />
        站点
      </h2>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const imageSize = item.imageSize ?? 44;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="acrylic-card group relative flex min-h-[108px] min-w-0 items-center overflow-hidden p-3.5 pr-[62px] transition-[background-color,border-color] duration-200 hover:border-white/25 hover:bg-[var(--glass-surface-hover)]"
            >
              <span className="relative z-10 min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-shadow-strong text-base font-semibold text-white">
                    {item.title}
                  </span>
                  {item.soon && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-50/80">
                      规划中
                    </span>
                  )}
                </span>
                <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                  {item.description}
                </span>
              </span>

              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                width={imageSize}
                height={imageSize}
                style={{
                  width: imageSize,
                  height: imageSize,
                  objectPosition: item.imagePosition,
                }}
                className="nav-art absolute bottom-3 right-3 shrink-0 object-contain transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
