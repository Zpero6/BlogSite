import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "../siteConfig";
import { formatArticleDate, getArticleSummaries, type ArticleSummary } from "../lib/blogApi";
import IdentityPanel from "../components/home/IdentityPanel";
import StatusPanel from "../components/home/StatusPanel";
import LatestPostsPanel from "../components/home/LatestPostsPanel";
import HomeHeader from "../components/home/HomeHeader";
import NavigationGrid from "../components/home/NavigationGrid";
import SkillsGrid from "../components/home/SkillsGrid";
import HeatmapSection from "../components/home/HeatmapSection";
import HeatmapSkeleton from "../components/home/HeatmapSkeleton";
import WallpaperControl from "../components/home/WallpaperControl";

export const dynamic = "force-dynamic";

async function readPosts(): Promise<Array<{ slug: string; title: string; formattedDate: string }>> {
  try {
    const articles: ArticleSummary[] = await getArticleSummaries();
    return articles.slice(0, 4).map((article) => ({
      slug: article.slug,
      title: article.title || "无标题",
      formattedDate: formatArticleDate(article.publishedAt),
    }));
  } catch (error) {
    console.error("[home] 无法读取后端文章列表", error);
    return [];
  }
}

export default async function Home() {
  const latestPosts = await readPosts();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        跳到主要内容
      </a>

      <main
        id="main"
        className="relative z-10 mx-auto w-[92%] max-w-[1320px] py-6 lg:w-[80%] lg:py-8 xl:w-[76%] 2xl:w-[70%]"
      >
        <div className="mb-6 lg:hidden">
          <HomeHeader compact />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(170px,20%)_minmax(0,1fr)] lg:gap-6 xl:gap-8">
          <aside className="flex flex-col gap-5">
            <IdentityPanel />
            <StatusPanel />
            <LatestPostsPanel posts={latestPosts} />
          </aside>

          <section className="flex min-w-0 flex-col gap-5">
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

        <footer className="text-shadow-strong mt-9 border-t border-white/15 pt-4 text-center text-[11px] text-white/65">
          <p>
            © {new Date().getFullYear()} {siteConfig.authorName}
            <span className="mx-2 text-white/30">·</span>
            写代码，也记录代码之外的日常
          </p>
          <nav
            aria-label="页脚导航"
            className="mt-2 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-white"
            >
              GitHub
            </a>
            <Link href="/about" className="transition-colors duration-200 hover:text-white">
              关于
            </Link>
            <Link href="/timeline" className="transition-colors duration-200 hover:text-white">
              时间线
            </Link>
            <WallpaperControl />
          </nav>
        </footer>
      </main>
    </>
  );
}
