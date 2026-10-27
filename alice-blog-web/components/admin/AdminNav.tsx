"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, MessageSquareText, RefreshCw } from "lucide-react";

const links = [
  { href: "/admin", label: "数据概览", icon: LayoutDashboard },
  { href: "/admin/sync", label: "内容同步", icon: RefreshCw },
  { href: "/admin/comments", label: "评论管理", icon: MessageSquareText },
];

const baseClass =
  "inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-colors duration-200";

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="管理后台导航" className="mb-4 flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${baseClass} ${
              active
                ? "border-cyan-100/35 bg-cyan-100/20 text-white"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/"
        className={`${baseClass} ml-auto border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white`}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        返回网站
      </Link>
    </nav>
  );
}
