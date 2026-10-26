import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ExternalLink, GitBranch } from "lucide-react";
import { siteConfig } from "../siteConfig";
import { albums } from "../data/albums";
import WallpaperLayer from "../components/home/WallpaperLayer";
import IdentityPanel from "../components/home/IdentityPanel";
import StatusPanel from "../components/home/StatusPanel";
import LatestPostsPanel from "../components/home/LatestPostsPanel";
import NavigationGrid from "../components/home/NavigationGrid";
import SkillsGrid from "../components/home/SkillsGrid";
import HeatmapSection from "../components/home/HeatmapSection";
import HeatmapSkeleton from "../components/home/HeatmapSkeleton";

function formatDate(value: string) {
  if (!value || value === "1970-01-01") return "刚刚更新";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function readPosts() {
  const directory = path.join(process.cwd(), "posts");

  try {
    if (!fs.existsSync(directory)) return [];

    return fs
      .readdirSync(directory)
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const { data } = matter(fs.readFileSync(path.join(directory, file), "utf8"));
        const rawDate = data.date || "1970-01-01";

        return {
          slug: file.replace(/\.md$/, ""),
          title: data.title || "无标题",
          date: rawDate,
          formattedDate: formatDate(rawDate),
        };
      })
      .sort((a, b) => {
        const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
        return byDate !== 0 ? byDate : b.slug.localeCompare(a.slug);
      });
  } catch {
    return [];
  }
}

function countChatters() {
  const directory = path.join(process.cwd(), "chatters");

  try {
    if (!fs.existsSync(directory)) return 0;
    return fs.readdirSync(directory).filter((file) => file.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

export default function Home() {
  const posts = readPosts();
  const chatterCount = countChatters();
  const photoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestPosts = posts.slice(0, 4);
  const firstWallpaper = siteConfig.wallpapers[0];

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={`${firstWallpaper.desktop}.avif`}
        type="image/avif"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={`${firstWallpaper.mobile}.avif`}
        type="image/avif"
        media="(max-width: 767px)"
        fetchPriority="high"
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-cyan-300"
      >
        跳到主要内容
      </a>

      <WallpaperLayer />

      <main
        id="main"
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1280px] items-start px-3 py-4 sm:px-6 sm:py-6 lg:items-center lg:px-8"
      >
        <div className="w-full overflow-hidden rounded-[26px] border border-white/[0.12] bg-[rgba(9,17,29,0.62)] p-3 shadow-2xl backdrop-blur-2xl max-lg:bg-[rgba(9,17,29,0.9)] max-lg:backdrop-blur-none sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <aside className="flex flex-col gap-4 lg:col-span-3">
              <IdentityPanel />
              <StatusPanel
                postCount={posts.length}
                chatterCount={chatterCount}
                photoCount={photoCount}
              />
              <LatestPostsPanel posts={latestPosts} />
            </aside>

            <section className="flex min-w-0 flex-col gap-5 lg:col-span-9">
              <header className="hidden flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 lg:flex">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/70">
                    Personal Dashboard
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {siteConfig.navTitle}
                    <span className="mx-1 text-cyan-400">{siteConfig.navSuffix}</span>
                    {siteConfig.navAfter}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Java 后端、分布式系统与 AI 应用的持续记录。选一个入口，继续探索。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                    在线
                  </span>
                  <a
                    href={siteConfig.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-300"
                  >
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    GitHub
                    <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                  </a>
                </div>
              </header>

              <Suspense fallback={<HeatmapSkeleton />}>
                <HeatmapSection />
              </Suspense>

              <NavigationGrid />
              <SkillsGrid />
            </section>
          </div>

          <footer className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {siteConfig.authorName} · 保持好奇，持续构建
            </p>
            <nav aria-label="页脚导航" className="flex flex-wrap items-center gap-4">
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-cyan-300"
              >
                GitHub
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </a>
              <Link href="/about" className="transition-colors duration-200 hover:text-cyan-300">
                关于
              </Link>
              <Link href="/timeline" className="transition-colors duration-200 hover:text-cyan-300">
                时间线
              </Link>
            </nav>
          </footer>
        </div>
      </main>
    </>
  );
}
