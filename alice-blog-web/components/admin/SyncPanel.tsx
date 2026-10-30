"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch, errorMessage, fetchCurrentUser, type CurrentUser } from "@/lib/apiClient";

type SyncItem = {
  file: string;
  slug: string | null;
  result: string;
  message: string;
};

type SyncResult = {
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  items: SyncItem[];
};

const resultStyles: Record<string, string> = {
  CREATED: "border-emerald-200/30 bg-emerald-300/10 text-emerald-50",
  UPDATED: "border-cyan-200/30 bg-cyan-300/10 text-cyan-50",
  UNCHANGED: "border-white/15 bg-white/5 text-white/70",
  FAILED: "border-rose-200/30 bg-rose-300/10 text-rose-50",
};

export default function SyncPanel() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [state, setState] = useState<"loading" | "anonymous" | "denied" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
        if (!current) setState("anonymous");
        else if (current.role !== "ADMIN") setState("denied");
        else setState("ready");
      })
      .catch(() => {
        if (active) setState("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  async function runSync() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<SyncResult>("/admin/markdown/sync", { method: "POST" });
      setResult(data);
    } catch (syncError) {
      setError(errorMessage(syncError));
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-white/70">正在校验管理员权限…</p>;
  }

  if (state === "anonymous") {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-cyan-100/80" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">需要管理员登录</h1>
        <p className="text-sm text-white/70">Markdown 同步会写入数据库，只有管理员可以执行。</p>
        <Link
          href="/login?next=/admin/sync"
          className="inline-flex rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-100/25"
        >
          去登录
        </Link>
      </div>
    );
  }

  if (state === "denied" || !user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-200/90" aria-hidden="true" />
        <h1 className="text-shadow-strong text-2xl font-bold text-white">没有管理员权限</h1>
        <p className="text-sm text-white/70">
          当前账号是 {user?.displayName ?? "普通用户"}，不能执行 Markdown 同步。
        </p>
        <Link href="/account" className="inline-flex text-sm font-semibold text-cyan-100 hover:text-white">
          返回个人中心
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Admin</p>
          <h1 className="text-shadow-strong mt-1 text-2xl font-bold text-white sm:text-3xl">Markdown 同步</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            读取后端配置的 <code className="rounded bg-white/10 px-1">content/posts</code>，按 slug 新增或更新文章。
            内容未变化时不会重复写入，草稿不会出现在公开文章接口中。
          </p>
        </div>
        <button
          type="button"
          onClick={runSync}
          disabled={busy}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-100/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
          {busy ? "同步中…" : "开始同步"}
        </button>
      </header>

      <p className="rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/65">
        当前管理员：{user.displayName}（{user.email}）。同步结果会写入 <code>markdown_sync_log</code>。
      </p>

      {error && (
        <p role="alert" className="rounded-[10px] border border-rose-200/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}

      {result && (
        <section aria-labelledby="sync-result-heading" className="space-y-4">
          <h2 id="sync-result-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-200/90" aria-hidden="true" />
            同步结果
          </h2>
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              ["文件", result.total],
              ["新增", result.created],
              ["更新", result.updated],
              ["未变化", result.unchanged],
              ["失败", result.failed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[12px] border border-white/15 bg-[rgba(12,24,32,0.35)] p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/55">{label}</dt>
                <dd className="mt-1 text-xl font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="overflow-x-auto rounded-[12px] border border-white/15">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">文件</th>
                  <th className="px-3 py-2 font-semibold">Slug</th>
                  <th className="px-3 py-2 font-semibold">结果</th>
                  <th className="px-3 py-2 font-semibold">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {result.items.map((item) => (
                  <tr key={`${item.file}-${item.slug ?? item.result}`}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">{item.file}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">{item.slug ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${resultStyles[item.result] ?? resultStyles.UNCHANGED}`}>
                        {item.result}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
