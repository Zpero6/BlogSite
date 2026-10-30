"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, EyeOff, MessageSquareText, ShieldCheck, Trash2 } from "lucide-react";
import { apiFetch, errorMessage, fetchCurrentUser, type CurrentUser } from "@/lib/apiClient";

type AdminComment = {
  id: number;
  articleId: number;
  articleTitle: string;
  articleSlug: string;
  authorId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  deleted: boolean;
  replyToId: number | null;
  createdAt: string;
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

function statusLabel(comment: AdminComment): { text: string; className: string } {
  if (comment.deleted) {
    return { text: "已删除", className: "border-rose-200/25 bg-rose-300/10 text-rose-100" };
  }
  if (comment.status === "HIDDEN") {
    return { text: "已隐藏", className: "border-amber-200/25 bg-amber-300/10 text-amber-100" };
  }
  return { text: "正常", className: "border-emerald-200/25 bg-emerald-300/10 text-emerald-100" };
}

export default function CommentsPanel() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [state, setState] = useState<"loading" | "anonymous" | "denied" | "ready">("loading");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const items = await apiFetch<AdminComment[]>("/admin/comments");
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
        if (!active) return;
        setUser(current);
        if (!current) setState("anonymous");
        else if (current.role !== "ADMIN") setState("denied");
        else {
          setState("ready");
          load();
        }
      })
      .catch(() => {
        if (active) setState("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  async function hide(commentId: number) {
    if (busyId) return;
    setBusyId(`hide-${commentId}`);
    setError(null);
    try {
      await apiFetch(`/admin/comments/${commentId}/hide`, { method: "PATCH" });
      await load();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(commentId: number) {
    if (busyId) return;
    if (!window.confirm("确定删除这条评论吗？公开页面会显示“该评论已删除”占位。")) return;
    setBusyId(`delete-${commentId}`);
    setError(null);
    try {
      await apiFetch(`/admin/comments/${commentId}`, { method: "DELETE" });
      await load();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在校验管理员权限…</p>;
  }

  if (state === "anonymous") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-cyan-100/80" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">需要管理员登录</h1>
        <p className="text-sm text-white/70">评论管理只对管理员开放。</p>
        <Link
          href="/login?next=/admin/comments"
          className="inline-flex rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-100/25"
        >
          去登录
        </Link>
      </div>
    );
  }

  if (state === "denied" || !user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-200/90" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">没有管理员权限</h1>
        <p className="text-sm text-white/70">当前账号是 {user?.displayName ?? "普通用户"}，不能管理评论。</p>
        <Link href="/account" className="inline-flex text-sm font-semibold text-cyan-100 hover:text-white">
          返回个人中心
        </Link>
      </div>
    );
  }

  const visibleCount = comments.filter((comment) => !comment.deleted && comment.status !== "HIDDEN").length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Admin</p>
          <h1 className="text-shadow-strong mt-1 flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
            <MessageSquareText className="h-6 w-6 text-cyan-100/80" aria-hidden="true" />
            评论管理
          </h1>
          <p className="mt-2 text-sm text-white/70">
            共 {comments.length} 条记录，其中 {visibleCount} 条正常显示。隐藏或删除后文章页会立即更新。
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-200/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-white/70">正在加载评论…</p>
      ) : comments.length === 0 ? (
        <p className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-white/70">
          还没有评论。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-white/15">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-3 py-2 font-semibold">文章</th>
                <th className="px-3 py-2 font-semibold">作者</th>
                <th className="px-3 py-2 font-semibold">内容</th>
                <th className="px-3 py-2 font-semibold">状态</th>
                <th className="px-3 py-2 font-semibold">时间</th>
                <th className="px-3 py-2 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white/80">
              {comments.map((comment) => {
                const status = statusLabel(comment);
                const locked = comment.deleted;
                return (
                  <tr key={comment.id} className="align-top">
                    <td className="max-w-[180px] px-3 py-3">
                      <Link href={`/posts/${comment.articleSlug}`} className="line-clamp-2 font-medium text-white/85 hover:text-cyan-100">
                        {comment.articleTitle}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium text-white/85">{comment.authorName}</p>
                      <p className="text-[10px] text-white/45">{comment.authorEmail}</p>
                    </td>
                    <td className="max-w-[320px] px-3 py-3">
                      <p className="line-clamp-2 whitespace-pre-wrap text-white/70" title={comment.content}>
                        {comment.content}
                      </p>
                      {comment.replyToId && <p className="mt-1 text-[10px] text-white/40">回复 #{comment.replyToId}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[11px] text-white/55">{formatTime(comment.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => hide(comment.id)}
                          disabled={locked || comment.status === "HIDDEN" || busyId !== null}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/75 hover:bg-white/15 disabled:opacity-40"
                        >
                          <EyeOff className="h-3 w-3" aria-hidden="true" />
                          隐藏
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(comment.id)}
                          disabled={locked || busyId !== null}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-rose-200/25 bg-rose-300/10 px-2 py-1 text-[10px] font-semibold text-rose-50 hover:bg-rose-300/20 disabled:opacity-40"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
