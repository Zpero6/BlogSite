import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "../siteConfig";
import { albums } from "../data/albums";
import IdentityPanel from "../components/home/IdentityPanel";
import StatusPanel from "../components/home/StatusPanel";
import LatestPostsPanel from "../components/home/LatestPostsPanel";
import HomeHeader from "../components/home/HomeHeader";
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

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-cyan-200"
      >
        跳到主要内容
      </a>

      <main
        id="main"
        className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="mb-4 lg:hidden">
          <HomeHeader compact />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <aside className="flex flex-col gap-4 lg:col-span-4 xl:col-span-3">
            <IdentityPanel />
            <StatusPanel
              postCount={posts.length}
              chatterCount={chatterCount}
              photoCount={photoCount}
            />
            <LatestPostsPanel posts={latestPosts} />
          </aside>

          <section className="flex min-w-0 flex-col gap-5 lg:col-span-8 xl:col-span-9">
            <div className="hidden lg:block">
              <HomeHeader />
            </div>

            <Suspense fallback={<HeatmapSkeleton />}>
              <HeatmapSection />
            </Suspense>

            <NavigationGrid />
            <SkillsGrid />
          </section>
        </div>

        <footer className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.authorName} · 保持好奇，持续构建
          </p>
          <nav aria-label="页脚导航" className="flex flex-wrap items-center gap-4">
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-cyan-200"
            >
              GitHub
            </a>
            <Link href="/about" className="transition-colors duration-200 hover:text-cyan-200">
              关于
            </Link>
            <Link href="/timeline" className="transition-colors duration-200 hover:text-cyan-200">
              时间线
            </Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
