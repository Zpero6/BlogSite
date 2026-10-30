"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/apiClient";

const fieldClass =
  "w-full rounded-[10px] border border-white/20 bg-[rgba(12,24,32,0.45)] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-200/15";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-[10px] border border-cyan-100/30 bg-cyan-100/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cyan-100/25 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function sendCode() {
    if (sending || seconds > 0) return;
    if (!email.trim()) {
      setError("请先填写邮箱");
      return;
    }
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      await apiFetch("/auth/email-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSeconds(60);
      setNotice("验证码已发送。开发环境请在后端日志中搜索 “DEV EMAIL CODE”。");
    } catch (sendError) {
      setError(errorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          password,
          code: code.trim(),
        }),
      });
      router.push("/account");
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
        <label htmlFor="register-email" className="mb-1.5 block text-xs font-semibold text-white/80">
          邮箱
        </label>
        <input
          id="register-email"
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
        <label htmlFor="register-name" className="mb-1.5 block text-xs font-semibold text-white/80">
          昵称
        </label>
        <input
          id="register-name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="nickname"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={fieldClass}
          placeholder="2–60 个字符"
        />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1.5 block text-xs font-semibold text-white/80">
          密码
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
          placeholder="8–72 位"
        />
      </div>

      <div>
        <label htmlFor="register-code" className="mb-1.5 block text-xs font-semibold text-white/80">
          邮箱验证码
        </label>
        <div className="flex items-center gap-2">
          <input
            id="register-code"
            type="text"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className={fieldClass}
            placeholder="6 位数字"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={sending || seconds > 0}
            className={secondaryButtonClass}
          >
            {sending ? "发送中…" : seconds > 0 ? `${seconds}s` : "获取验证码"}
          </button>
        </div>
      </div>

      {notice && (
        <p aria-live="polite" className="rounded-[10px] border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-xs text-cyan-50">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" aria-live="polite" className="rounded-[10px] border border-rose-200/25 bg-rose-300/10 px-3 py-2 text-xs text-rose-50">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={buttonClass}>
        {busy ? "注册中…" : "注册并登录"}
      </button>

      <p className="text-center text-xs text-white/65">
        已有账号？
        <Link href="/login" className="ml-1 font-semibold text-cyan-100 hover:text-white">
          登录
        </Link>
      </p>
    </form>
  );
}
