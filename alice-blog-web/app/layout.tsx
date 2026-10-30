import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../siteConfig";
import { siteUrl } from "../lib/siteUrl";
import WallpaperLayer from "../components/home/WallpaperLayer";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <link
          rel="preload"
          as="image"
          href={`${siteConfig.wallpapers[0].desktopBlur}.avif`}
          type="image/avif"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href={`${siteConfig.wallpapers[0].mobileBlur}.avif`}
          type="image/avif"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        <WallpaperLayer />
        <div className="relative z-10 min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
