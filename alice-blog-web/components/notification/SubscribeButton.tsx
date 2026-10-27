"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { ApiError, apiFetch, errorMessage, fetchCurrentUser } from "@/lib/apiClient";

type State = "loading" | "anonymous" | "subscribed" | "not-subscribed";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const idleClass =
  "border-slate-300/60 bg-white/45 text-slate-700 hover:bg-white/70 dark:border-white/15 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-900/50";
const activeClass =
  "border-amber-300/70 bg-amber-100/70 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-200";

export default function SubscribeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then(async (user) => {
        if (!active) return;
        if (!user) {
          setState("anonymous");
          return;
        }
        const result = await apiFetch<{ subscribed: boolean }>("/subscriptions/blog");
        if (active) setState(result.subscribed ? "subscribed" : "not-subscribed");
      })
      .catch(() => {
        if (active) setState("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggle() {
    if (state === "loading" || busy) return;
    if (state === "anonymous") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const method = state === "subscribed" ? "DELETE" : "PUT";
      const result = await apiFetch<{ subscribed: boolean }>("/subscriptions/blog", { method });
      setState(result.subscribed ? "subscribed" : "not-subscribed");
    } catch (toggleError) {
      if (toggleError instanceof ApiError && toggleError.status === 401) {
        setState("anonymous");
      } else {
        setError(errorMessage(toggleError));
      }
    } finally {
      setBusy(false);
    }
  }

  const subscribed = state === "subscribed";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={state === "loading" || busy}
          aria-pressed={subscribed}
          className={`${buttonClass} ${subscribed ? activeClass : idleClass}`}
        >
          {subscribed ? (
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          ) : state === "anonymous" ? (
            <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {state === "loading" ? "订阅状态…" : subscribed ? "已订阅本站" : busy ? "处理中…" : "订阅本站"}
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          新文章首次发布时会收到站内通知
        </span>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
