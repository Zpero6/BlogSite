"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Eye,
  Heart,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiFetch, errorMessage, fetchCurrentUser, type CurrentUser } from "@/lib/apiClient";

type Statistics = {
  users: number;
  articles: number;
  publishedArticles: number;
  views: number;
  likes: number;
  favorites: number;
  comments: number;
  subscriptions: number;
  notifications: number;
  lastSyncAt: string | null;
};

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}

function formatTime(value: string | null): string {
  if (!value) return "尚未同步";
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

export default function DashboardPanel() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [state, setState] = useState<"loading" | "anonymous" | "denied" | "ready">("loading");
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then(async (current) => {
        if (!active) return;
        setUser(current);
        if (!current) {
          setState("anonymous");
          return;
        }
        if (current.role !== "ADMIN") {
          setState("denied");
          return;
        }
        try {
          const data = await apiFetch<Statistics>("/admin/statistics");
          if (active) {
            setStats(data);
            setState("ready");
          }
        } catch (loadError) {
          if (active) {
            setError(errorMessage(loadError));
            setState("ready");
          }
        }
      })
      .catch(() => {
        if (active) setState("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在读取统计数据…</p>;
  }

  if (state === "anonymous") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-cyan-100/80" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">需要管理员登录</h1>
        <Link
          href="/login?next=/admin"
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
        <p className="text-sm text-white/70">当前账号是 {user?.displayName ?? "普通用户"}。</p>
        <Link href="/account" className="inline-flex text-sm font-semibold text-cyan-100 hover:text-white">
          返回个人中心
        </Link>
      </div>
    );
  }

  const cards = [
    { label: "用户", value: stats?.users ?? 0, icon: Users },
    { label: "已发布文章", value: stats?.publishedArticles ?? 0, detail: `共 ${stats?.articles ?? 0} 篇`, icon: RefreshCw },
    { label: "浏览量", value: stats?.views ?? 0, icon: Eye },
    { label: "点赞", value: stats?.likes ?? 0, icon: Heart },
    { label: "收藏", value: stats?.favorites ?? 0, icon: Bookmark },
    { label: "评论", value: stats?.comments ?? 0, icon: MessageSquareText },
    { label: "订阅", value: stats?.subscriptions ?? 0, icon: Users },
    { label: "通知", value: stats?.notifications ?? 0, icon: MessageSquareText },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Admin</p>
          <h1 className="text-shadow-strong mt-1 text-2xl font-bold text-white sm:text-3xl">数据概览</h1>
          <p className="mt-2 text-sm text-white/70">
            最近一次同步：{formatTime(stats?.lastSyncAt ?? null)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/sync"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-100/25"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            内容同步
          </Link>
          <Link
            href="/admin/comments"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
            评论管理
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-200/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[12px] border border-white/15 bg-[rgba(12,24,32,0.35)] p-4">
              <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {card.label}
              </dt>
              <dd className="mt-2 text-2xl font-bold text-white">{formatNumber(card.value)}</dd>
              {card.detail && <p className="mt-0.5 text-[10px] text-white/45">{card.detail}</p>}
            </div>
          );
        })}
      </dl>

      <p className="rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60">
        统计来自 MySQL 中的用户、文章、浏览、互动、评论、订阅和通知表。浏览量按 `(article_id, viewer_key)` 去重。
      </p>
    </div>
  );
}
