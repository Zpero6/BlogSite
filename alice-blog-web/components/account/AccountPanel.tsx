"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Bookmark, LogIn, LogOut, Settings2, UserPlus } from "lucide-react";
import { fetchCurrentUser, logout, type CurrentUser } from "@/lib/apiClient";
import { siteConfig } from "@/siteConfig";

const actionClass =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:border-white/35 hover:bg-white/20";

export default function AccountPanel() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "anonymous" | "ready">("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
        setState(current ? "ready" : "anonymous");
      })
      .catch(() => {
        if (active) setState("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在读取登录状态…</p>;
  }

  if (state === "anonymous" || !user) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <img src={siteConfig.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
        </div>
        <div>
          <h1 className="text-shadow-strong text-2xl font-bold text-white">尚未登录</h1>
          <p className="mt-2 text-sm text-white/70">
            登录后可以管理文章同步、参与互动，并在这里查看账户状态。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/login?next=/account" className={actionClass}>
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            登录
          </Link>
          <Link href="/register" className={actionClass}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header className="flex items-center gap-4">
        <img
          src={siteConfig.avatarUrl}
          alt=""
          className="h-16 w-16 rounded-full border border-white/20 object-cover"
        />
        <div className="min-w-0">
          <h1 className="text-shadow-strong truncate text-xl font-bold text-white sm:text-2xl">
            {user.displayName}
          </h1>
          <p className="truncate text-sm text-white/70">{user.email}</p>
          <span className="mt-1 inline-flex rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            {user.role === "ADMIN" ? "管理员" : "普通用户"}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[12px] border border-white/15 bg-[rgba(12,24,32,0.35)] p-3.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/55">用户 ID</dt>
          <dd className="mt-1 text-sm text-white/90">#{user.id}</dd>
        </div>
        <div className="rounded-[12px] border border-white/15 bg-[rgba(12,24,32,0.35)] p-3.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/55">会话</dt>
          <dd className="mt-1 text-sm text-white/90">Spring Session · MySQL</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/favorites" className={actionClass}>
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          我的收藏
        </Link>
        <Link href="/notifications" className={actionClass}>
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          站内通知
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin/sync" className={actionClass}>
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
            管理后台
          </Link>
        )}
        <Link href="/" className={actionClass}>
          返回首页
        </Link>
        <button type="button" onClick={handleLogout} disabled={busy} className={`${actionClass} disabled:opacity-50`}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {busy ? "退出中…" : "退出登录"}
        </button>
      </div>
    </div>
  );
}
