import type { Metadata } from "next";
import CommentsPanel from "@/components/admin/CommentsPanel";
import { siteConfig } from "@/siteConfig";

export const metadata: Metadata = {
  title: "评论管理",
  description: `${siteConfig.title} 管理后台：评论管理。`,
  robots: { index: false, follow: false },
};

export default function AdminCommentsPage() {
  return <CommentsPanel />;
}
