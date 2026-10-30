"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCheck, LogIn } from "lucide-react";
import { ApiError, apiFetch, errorMessage } from "@/lib/apiClient";

type Notification = {
  id: number;
  articleId: number;
  articleSlug: string;
  articleTitle: string;
  read: boolean;
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

export default function NotificationsPanel() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "anonymous" | "ready">("loading");
  const [items, setItems] = useState<Notification[]>([]);
  const [busyId, setBusyId] = useState<number | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<Notification[]>("/notifications")
      .then((data) => {
        if (!active) return;
        setItems(data);
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

  async function markRead(id: number) {
    if (busyId !== null) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (readError) {
      if (readError instanceof ApiError && readError.status === 401) router.push("/login?next=/notifications");
      else setError(errorMessage(readError));
    } finally {
      setBusyId(null);
    }
  }

  async function markAll() {
    if (busyId !== null) return;
    setBusyId("all");
    setError(null);
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (readError) {
      if (readError instanceof ApiError && readError.status === 401) router.push("/login?next=/notifications");
      else setError(errorMessage(readError));
    } finally {
      setBusyId(null);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在读取通知…</p>;
  }

  if (state === "anonymous") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <Bell className="mx-auto h-10 w-10 text-cyan-100/80" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">登录后查看通知</h1>
        <p className="text-sm text-white/70">订阅本站后，新文章发布时会在这里收到提醒。</p>
        <Link
          href="/login?next=/notifications"
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-100/25"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          去登录
        </Link>
      </div>
    );
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Inbox</p>
          <h1 className="text-shadow-strong mt-1 text-2xl font-bold text-white sm:text-3xl">站内通知</h1>
          <p className="mt-2 text-sm text-white/70">
            共 {items.length} 条，{unread} 条未读。
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            disabled={busyId !== null}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            全部已读
          </button>
        )}
      </header>

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-200/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-10 text-center">
          <BellOff className="mx-auto h-8 w-8 text-white/40" aria-hidden="true" />
          <p className="mt-3 text-sm text-white/70">还没有通知。</p>
          <Link href="/timeline" className="mt-2 inline-flex text-xs font-semibold text-cyan-100 hover:text-white">
            去时间线阅读文章
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 rounded-[12px] border p-4 ${
                item.read
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-cyan-200/25 bg-cyan-200/[0.08]"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  item.read ? "bg-white/20" : "bg-cyan-300"
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/posts/${item.articleSlug}`}
                  className="text-shadow-strong line-clamp-2 text-sm font-semibold text-white hover:text-cyan-100"
                >
                  {item.articleTitle}
                </Link>
                <p className="mt-1 text-[11px] text-white/50">
                  {item.read ? "已读" : "新文章发布"} · {formatTime(item.createdAt)}
                </p>
              </div>
              {!item.read && (
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  disabled={busyId !== null}
                  className="shrink-0 rounded-[8px] border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-white/75 hover:bg-white/15 disabled:opacity-50"
                >
                  {busyId === item.id ? "处理中…" : "标为已读"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
