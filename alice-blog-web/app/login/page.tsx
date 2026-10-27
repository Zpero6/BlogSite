import type { Metadata } from "next";
import InnerPageShell from "@/components/InnerPageShell";
import LoginForm from "@/components/account/LoginForm";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "登录",
  description: `登录 ${siteConfig.title}，参与点赞、收藏、评论和订阅。`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <InnerPageShell>
      <div className="mx-auto w-full max-w-2xl py-4">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Account</p>
          <h1 className="text-shadow-strong mt-2 text-2xl font-bold text-white sm:text-3xl">登录小站</h1>
          <p className="mt-2 text-sm text-white/70">
            使用邮箱和密码登录。登录状态保存在 MySQL Session 中，刷新页面不会丢失。
          </p>
        </header>
        <LoginForm />
      </div>
    </InnerPageShell>
  );
}
