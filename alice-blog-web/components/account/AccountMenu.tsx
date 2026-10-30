"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Settings2, UserRound } from "lucide-react";
import { fetchCurrentUser, logout, type CurrentUser } from "@/lib/apiClient";

const pillClass =
  "inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/20 bg-[rgba(20,35,45,0.32)] px-2.5 text-[11px] font-medium text-white/90 transition-colors duration-200 hover:border-white/35 hover:bg-[rgba(32,50,60,0.48)] hover:text-white";

export default function AccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <span className={`${pillClass} opacity-60`} aria-hidden="true">
        <UserRound className="h-3.5 w-3.5" />
        账户
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className={pillClass} title="登录或注册">
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        登录
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Link
        href="/account"
        className={`${pillClass} max-w-[120px]`}
        title={`${user.displayName}（${user.email}）`}
      >
        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{user.displayName}</span>
      </Link>
      {user.role === "ADMIN" && (
        <Link href="/admin/sync" className={pillClass} title="管理后台">
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          管理
        </Link>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className={`${pillClass} disabled:opacity-50`}
        title="退出登录"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? "退出中" : "退出"}
      </button>
    </span>
  );
}
