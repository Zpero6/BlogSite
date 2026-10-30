import type { MetadataRoute } from "next";
import { getArticleSummaries } from "@/lib/blogApi";
import { siteUrl } from "@/lib/siteUrl";

const staticPaths = [
  "",
  "/timeline",
  "/about",
  "/projects",
  "/chatter",
  "/moments",
  "/photowall",
  "/music",
  "/friends",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/timeline" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/timeline" ? 0.8 : 0.6,
  }));

  try {
    const articles = await getArticleSummaries();
    return [
      ...staticEntries,
      ...articles.map((article) => ({
        url: `${siteUrl}/posts/${article.slug}`,
        lastModified: article.publishedAt ? new Date(`${article.publishedAt}T00:00:00+08:00`) : now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
