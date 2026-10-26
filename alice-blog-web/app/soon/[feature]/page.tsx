import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import InnerPageShell from "@/components/InnerPageShell";
import PageTransition from "@/components/PageTransition";
import { siteConfig } from "@/siteConfig";

const features = {
  favorites: {
    title: "收藏",
    description: "收藏功能正在规划中。之后可以在这里整理文章、项目和外部链接。",
  },
  notifications: {
    title: "通知",
    description: "消息中心正在规划中。之后会在这里汇总回复、订阅更新和系统通知。",
  },
  account: {
    title: "登录 / 个人中心",
    description: "账户体系正在规划中。后端已经具备注册登录接口，前端入口会在联调完成后开放。",
  },
} as const;

type Feature = keyof typeof features;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(features).map((feature) => ({ feature }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ feature: string }>;
}): Promise<Metadata> {
  const { feature } = await params;
  const item = features[feature as Feature];
  return {
    title: item ? `${item.title}（规划中）` : "规划中",
  };
}

export default async function SoonPage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const item = features[feature as Feature];

  if (!item) notFound();

  return (
    <InnerPageShell>
      <PageTransition>
        <main className="mx-auto flex w-full max-w-2xl items-center py-6 sm:py-12">
          <div className="acrylic-card w-full p-6 sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
              <Construction className="h-6 w-6" aria-hidden="true" />
            </span>

            <p className="mt-5 text-xs font-bold text-cyan-200">规划中</p>
            <h1 className="mt-1 text-3xl font-black text-white">{item.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition-colors duration-200 hover:bg-cyan-200"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                返回菜单
              </Link>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-bold text-slate-300 transition-colors duration-200 hover:border-cyan-300/30 hover:text-cyan-200"
              >
                关注开发进度
              </a>
            </div>
          </div>
        </main>
      </PageTransition>
    </InnerPageShell>
  );
}
