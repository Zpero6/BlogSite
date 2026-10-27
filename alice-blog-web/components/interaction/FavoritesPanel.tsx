"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookmarkX, LogIn } from "lucide-react";
import { ApiError, apiFetch, errorMessage } from "@/lib/apiClient";
import { articleCover, formatArticleDate, type ArticleSummary } from "@/lib/blogApi";

export default function FavoritesPanel() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "anonymous" | "ready">("loading");
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<ArticleSummary[]>("/favorites")
      .then((items) => {
        if (!active) return;
        setArticles(items);
        setState("ready");
      })
      .catch((loadError) => {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 401) setState("anonymous");
        else {
          setError(errorMessage(loadError));
          setState("ready");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(articleId: number) {
    if (removing !== null) return;
    setRemoving(articleId);
    setError(null);
    try {
      await apiFetch(`/articles/${articleId}/favorite`, { method: "DELETE" });
      setArticles((items) => items.filter((item) => item.id !== articleId));
    } catch (removeError) {
      if (removeError instanceof ApiError && removeError.status === 401) {
        router.push("/login?next=/favorites");
      } else {
        setError(errorMessage(removeError));
      }
    } finally {
      setRemoving(null);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在读取收藏…</p>;
  }

  if (state === "anonymous") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <LogIn className="mx-auto h-10 w-10 text-cyan-100/80" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">登录后查看收藏</h1>
        <p className="text-sm text-white/70">收藏与账号绑定，登录后可以在这里管理收藏的文章。</p>
        <Link
          href="/login?next=/favorites"
          className="inline-flex rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-100/25"
        >
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Saved</p>
        <h1 className="text-shadow-strong mt-1 text-2xl font-bold text-white sm:text-3xl">我的收藏</h1>
        <p className="mt-2 text-sm text-white/70">共 {articles.length} 篇文章。</p>
      </header>

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-200/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}

      {articles.length === 0 ? (
        <div className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-8 text-center">
          <p className="text-sm text-white/70">还没有收藏文章。</p>
          <Link href="/timeline" className="mt-3 inline-flex text-sm font-semibold text-cyan-100 hover:text-white">
            去时间线看看
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-3 rounded-[12px] border border-white/15 bg-[rgba(12,24,32,0.35)] p-4 sm:flex-row sm:items-center"
            >
              <img
                src={articleCover(article)}
                alt=""
                className="h-16 w-24 shrink-0 rounded-[8px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/posts/${article.slug}`}
                  className="text-shadow-strong line-clamp-1 text-base font-semibold text-white hover:text-cyan-100"
                >
                  {article.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/65">{article.summary}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-white/50">
                  <time>{formatArticleDate(article.publishedAt)}</time>
                  {article.category && <span>· {article.category}</span>}
                  {article.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(article.id)}
                disabled={removing !== null}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                <BookmarkX className="h-3.5 w-3.5" aria-hidden="true" />
                取消收藏
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
