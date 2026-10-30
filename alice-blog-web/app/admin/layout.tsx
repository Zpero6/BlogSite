import type { Metadata } from "next";
import type { ReactNode } from "react";
import InnerPageShell from "@/components/InnerPageShell";
import AdminNav from "@/components/admin/AdminNav";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "管理后台",
  description: `${siteConfig.title} 管理后台`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <InnerPageShell size="wide">
      <AdminNav />
      <div className="py-4">{children}</div>
    </InnerPageShell>
  );
}
