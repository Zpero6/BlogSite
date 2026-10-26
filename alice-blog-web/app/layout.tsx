import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../siteConfig";

export const metadata: Metadata = {
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
      <body className="min-h-full font-serif">
        {children}
      </body>
    </html>
  );
}
