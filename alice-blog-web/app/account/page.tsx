import type { Metadata } from "next";
import InnerPageShell from "@/components/InnerPageShell";
import AccountPanel from "@/components/account/AccountPanel";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "个人中心",
  description: `${siteConfig.title} 的账户与登录状态。`,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <InnerPageShell>
      <div className="py-4">
        <AccountPanel />
      </div>
    </InnerPageShell>
  );
}
