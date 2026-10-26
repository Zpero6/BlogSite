import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

type LatestPost = {
  slug: string;
  title: string;
  formattedDate: string;
};

export default function LatestPostsPanel({ posts }: { posts: LatestPost[] }) {
  return (
    <section
      className="cv-auto rounded-2xl border border-white/10 bg-white/[0.035] p-5"
      aria-labelledby="latest-posts-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="latest-posts-heading" className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-200">
          <BookOpen className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          最新文章
        </h2>
        <Link
          href="/timeline"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 transition-colors duration-200 hover:text-cyan-300"
        >
          全部
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {posts.length > 0 ? (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="group flex flex-col gap-0.5 py-2.5 transition-colors duration-200"
              >
                <span className="line-clamp-1 text-sm font-bold text-slate-200 transition-colors duration-200 group-hover:text-cyan-300">
                  {post.title}
                </span>
                <time className="text-[10px] font-bold tracking-wider text-slate-500">
                  {post.formattedDate}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">暂无文章</p>
      )}
    </section>
  );
}
