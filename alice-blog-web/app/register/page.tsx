import type { Metadata } from "next";
import InnerPageShell from "@/components/InnerPageShell";
import RegisterForm from "@/components/account/RegisterForm";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "注册",
  description: `注册 ${siteConfig.title} 账号，参与文章互动与订阅。`,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <InnerPageShell>
      <div className="mx-auto w-full max-w-2xl py-4">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/75">Join</p>
          <h1 className="text-shadow-strong mt-2 text-2xl font-bold text-white sm:text-3xl">注册账号</h1>
          <p className="mt-2 text-sm text-white/70">
            开发阶段验证码写入后端日志；正式开放注册前会接入邮件服务。
          </p>
        </header>
        <RegisterForm />
      </div>
    </InnerPageShell>
  );
}
