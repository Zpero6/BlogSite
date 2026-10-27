"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/apiClient";

const fieldClass =
  "w-full rounded-[10px] border border-white/20 bg-[rgba(12,24,32,0.45)] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-200/15";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cyan-100/25 disabled:cursor-not-allowed disabled:opacity-50";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const requested = new URLSearchParams(window.location.search).get("next");
      const target = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
      router.push(target);
      router.refresh();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-white/80">
          邮箱
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-white/80">
          密码
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
          placeholder="至少 8 位"
        />
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="rounded-[10px] border border-rose-200/25 bg-rose-300/10 px-3 py-2 text-xs text-rose-50">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={buttonClass}>
        {busy ? "登录中…" : "登录"}
      </button>

      <p className="text-center text-xs text-white/65">
        还没有账号？
        <Link href="/register" className="ml-1 font-semibold text-cyan-100 hover:text-white">
          注册
        </Link>
      </p>
    </form>
  );
}
