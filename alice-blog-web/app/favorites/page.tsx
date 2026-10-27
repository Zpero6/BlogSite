import type { Metadata } from "next";
import InnerPageShell from "@/components/InnerPageShell";
import FavoritesPanel from "@/components/interaction/FavoritesPanel";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "我的收藏",
  description: `${siteConfig.title} 的收藏文章。`,
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <InnerPageShell>
      <div className="py-4">
        <FavoritesPanel />
      </div>
    </InnerPageShell>
  );
}
