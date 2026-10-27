import Link from "next/link";
import { ArrowRight } from "lucide-react";

type LatestPost = {
  slug: string;
  title: string;
  formattedDate: string;
};

export default function LatestPostsPanel({ posts }: { posts: LatestPost[] }) {
  return (
    <section
      className="acrylic-panel acrylic-panel--quiet p-4"
      aria-labelledby="latest-posts-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="latest-posts-heading"
          className="text-shadow-strong text-[13px] font-semibold text-white/95"
        >
          最近更新
        </h2>
        <Link
          href="/timeline"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-shadow-strong text-white/75 transition-colors duration-200 hover:text-white"
        >
          全部
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {posts.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="group flex flex-col gap-0.5"
              >
                <span className="text-shadow-strong line-clamp-2 text-[13px] font-medium text-white/90 transition-colors duration-200 group-hover:text-white">
                  {post.title}
                </span>
                <time className="text-[10px] text-shadow-strong text-white/70">
                  {post.formattedDate}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-shadow-strong text-white/70">暂无文章</p>
      )}
    </section>
  );
}
