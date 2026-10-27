"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-[92%] max-w-3xl items-center justify-center py-10">
      <div className="acrylic-panel w-full p-6 text-center sm:p-10">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-200/90" aria-hidden="true" />
        <h1 className="text-shadow-strong mt-4 text-2xl font-bold text-white">页面暂时无法打开</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          可能是后端服务尚未启动，或文章接口返回了错误。请确认 Spring Boot 运行在 8080 端口后重试。
        </p>
        <p className="mx-auto mt-2 max-w-xl break-all font-mono text-[11px] text-white/45">
          {error.message}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-100/25"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-[10px] border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
