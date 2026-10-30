import type { Metadata } from "next";
import InnerPageShell from "@/components/InnerPageShell";
import NotificationsPanel from "@/components/notification/NotificationsPanel";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "站内通知",
  description: `${siteConfig.title} 的站内通知。`,
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <InnerPageShell>
      <div className="py-4">
        <NotificationsPanel />
      </div>
    </InnerPageShell>
  );
}
