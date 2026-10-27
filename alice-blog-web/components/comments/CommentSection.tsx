"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageSquare, Reply, Trash2 } from "lucide-react";
import { ApiError, apiFetch, errorMessage, fetchCurrentUser, type CurrentUser } from "@/lib/apiClient";

type CommentNode = {
  id: number;
  articleId: number;
  authorId: number;
  authorName: string;
  content: string;
  deleted: boolean;
  replyToId: number | null;
  replyToName: string | null;
  createdAt: string;
  replies: CommentNode[];
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function countComments(nodes: CommentNode[]): number {
  return nodes.reduce(
    (total, node) => total + (node.deleted ? 0 : 1) + countComments(node.replies),
    0,
  );
}

const actionButtonClass =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white";

const fieldClass =
  "w-full rounded-[12px] border border-slate-300/70 bg-white/70 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function CommentSection({ articleId }: { articleId: number }) {
  const pathname = usePathname();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function reload() {
    try {
      const items = await apiFetch<CommentNode[]>(`/articles/${articleId}/comments`);
      setComments(items);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    apiFetch<CommentNode[]>(`/articles/${articleId}/comments`)
      .then((items) => {
        if (active) setComments(items);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [articleId]);

  function handleUnauthorized(submitError: unknown): boolean {
    if (submitError instanceof ApiError && submitError.status === 401) {
      setUser(null);
      setError("登录状态已失效，请重新登录后再评论。");
      return true;
    }
    return false;
  }

  async function submitTop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch<CommentNode>(`/articles/${articleId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setContent("");
      await reload();
    } catch (submitError) {
      if (!handleUnauthorized(submitError)) setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(event: React.FormEvent<HTMLFormElement>, targetId: number) {
    event.preventDefault();
    const text = replyContent.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch<CommentNode>(`/comments/${targetId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setReplyContent("");
      setReplyTo(null);
      await reload();
    } catch (submitError) {
      if (!handleUnauthorized(submitError)) setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: number) {
    if (deleting !== null) return;
    if (!window.confirm("删除后评论会保留“已删除”占位，确定删除吗？")) return;
    setDeleting(commentId);
    setError(null);
    try {
      await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
      await reload();
    } catch (deleteError) {
      if (!handleUnauthorized(deleteError)) setError(errorMessage(deleteError));
    } finally {
      setDeleting(null);
    }
  }

  function renderComment(comment: CommentNode, depth: number) {
    const canReply = Boolean(user) && !comment.deleted;
    const canDelete = Boolean(user) && user?.id === comment.authorId && !comment.deleted;
    return (
      <li key={comment.id} className={depth > 0 ? "ml-5 sm:ml-10" : ""}>
        <article className="rounded-[12px] border border-slate-300/60 bg-white/45 p-3.5 dark:border-white/10 dark:bg-slate-900/25">
          <header className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-white/80">
              {comment.deleted ? "已" : comment.authorName.slice(0, 1)}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {comment.authorName}
            </span>
            {comment.replyToName && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                回复 @{comment.replyToName}
              </span>
            )}
            <time className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
              {formatTime(comment.createdAt)}
            </time>
          </header>

          <p
            className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${
              comment.deleted
                ? "italic text-slate-400 dark:text-slate-500"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {comment.deleted ? "该评论已删除" : comment.content}
          </p>

          <div className="mt-1.5 flex items-center gap-1">
            {canReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(replyTo === comment.id ? null : comment.id);
                  setReplyContent("");
                }}
                className={actionButtonClass}
              >
                <Reply className="h-3 w-3" aria-hidden="true" />
                回复
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => remove(comment.id)}
                disabled={deleting !== null}
                className={actionButtonClass}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                {deleting === comment.id ? "删除中…" : "删除"}
              </button>
            )}
          </div>

          {replyTo === comment.id && (
            <form onSubmit={(event) => submitReply(event, comment.id)} className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                required
                maxLength={2000}
                rows={2}
                className={fieldClass}
                placeholder={`回复 @${comment.authorName}`}
                aria-label={`回复 ${comment.authorName}`}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-[8px] border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-500/25 disabled:opacity-50 dark:text-cyan-100"
                >
                  {busy ? "发送中…" : "发送回复"}
                </button>
              </div>
            </form>
          )}
        </article>

        {comment.replies.length > 0 && (
          <ul className="mt-2 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <section aria-labelledby="comments-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="comments-heading" className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          评论
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {countComments(comments)}
          </span>
        </h2>
        {!user && (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 dark:text-cyan-200 dark:hover:text-white"
          >
            登录后参与评论
          </Link>
        )}
      </div>

      {user ? (
        <form onSubmit={submitTop} className="space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={2000}
            rows={3}
            className={fieldClass}
            placeholder="留下你的想法…"
            aria-label="发表评论"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{content.length}/2000</span>
            <button
              type="submit"
              disabled={busy}
              className="rounded-[8px] border border-cyan-500/30 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-500/25 disabled:opacity-50 dark:text-cyan-100"
            >
              {busy ? "发送中…" : "发表评论"}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-[10px] border border-slate-300/50 bg-white/35 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          当前为只读模式。登录后可以发表评论、回复和删除自己的评论。
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-300/50 bg-rose-100/50 px-3 py-2 text-xs text-rose-700 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">正在加载评论…</p>
      ) : comments.length === 0 ? (
        <p className="rounded-[10px] border border-slate-300/50 bg-white/35 px-3 py-4 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          还没有评论，来写第一条吧。
        </p>
      ) : (
        <ul className="space-y-3">{comments.map((comment) => renderComment(comment, 0))}</ul>
      )}
    </section>
  );
}
