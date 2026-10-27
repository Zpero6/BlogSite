import type { Metadata } from "next";
import SyncPanel from "@/components/admin/SyncPanel";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "Markdown 同步",
  description: `${siteConfig.title} 管理后台：Markdown 同步。`,
  robots: { index: false, follow: false },
};

export default function AdminSyncPage() {
  return <SyncPanel />;
}
