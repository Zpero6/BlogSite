"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bookmark, Eye, Heart } from "lucide-react";
import { ApiError, apiFetch, errorMessage } from "@/lib/apiClient";

type InteractionState = {
  authenticated: boolean;
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  favoriteCount: number;
};

type ViewResult = {
  counted: boolean;
  viewCount: number;
};

const pillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-300/60 bg-white/45 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-900/50";

const activeLikeClass =
  "border-rose-300/70 bg-rose-100/70 text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/15 dark:text-rose-200";

const activeFavoriteClass =
  "border-cyan-300/70 bg-cyan-100/70 text-cyan-700 dark:border-cyan-300/30 dark:bg-cyan-400/15 dark:text-cyan-200";

export default function InteractionBar({
  articleId,
  initialViewCount,
  initialLikeCount,
  initialFavoriteCount,
}: {
  articleId: number;
  initialViewCount: number;
  initialLikeCount: number;
  initialFavoriteCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [state, setState] = useState<InteractionState>({
    authenticated: false,
    liked: false,
    favorited: false,
    likeCount: initialLikeCount,
    favoriteCount: initialFavoriteCount,
  });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"like" | "favorite" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<InteractionState>(`/articles/${articleId}/interactions`)
      .then((current) => {
        if (active) setState(current);
      })
      .catch(() => {
        // Keep the server-rendered counts when the interaction state is unavailable.
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    apiFetch<ViewResult>(`/articles/${articleId}/view`, { method: "POST" })
      .then((result) => {
        if (active) setViewCount(result.viewCount);
      })
      .catch(() => {
        // Reading must not fail because view tracking failed.
      });

    return () => {
      active = false;
    };
  }, [articleId]);

  function requireLogin(): boolean {
    if (state.authenticated) return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  }

  async function toggle(kind: "like" | "favorite") {
    if (busy || requireLogin()) return;
    setBusy(kind);
    setError(null);
    const active = kind === "like" ? state.liked : state.favorited;
    try {
      const next = await apiFetch<InteractionState>(`/articles/${articleId}/${kind}`, {
        method: active ? "DELETE" : "PUT",
      });
      setState(next);
    } catch (toggleError) {
      if (toggleError instanceof ApiError && toggleError.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else {
        setError(errorMessage(toggleError));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${pillClass} cursor-default`} title="去重后的阅读量">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {viewCount} 阅读
        </span>
        <button
          type="button"
          onClick={() => toggle("like")}
          disabled={busy !== null || !loaded}
          aria-pressed={state.liked}
          className={`${pillClass} ${state.liked ? activeLikeClass : ""}`}
        >
          <Heart className={`h-3.5 w-3.5 ${state.liked ? "fill-current" : ""}`} aria-hidden="true" />
          {state.likeCount} 赞
        </button>
        <button
          type="button"
          onClick={() => toggle("favorite")}
          disabled={busy !== null || !loaded}
          aria-pressed={state.favorited}
          className={`${pillClass} ${state.favorited ? activeFavoriteClass : ""}`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${state.favorited ? "fill-current" : ""}`} aria-hidden="true" />
          {state.favoriteCount} 收藏
        </button>
        {loaded && !state.authenticated && (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="text-xs font-semibold text-cyan-200/85 underline-offset-4 hover:text-white hover:underline"
          >
            登录后点赞或收藏
          </Link>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
