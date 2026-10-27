import { cache } from "react";
import { siteConfig } from "@/siteConfig";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";

export type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  cover: string | null;
  category: string | null;
  tags: string[];
  publishedAt: string | null;
};

export type ArticleDetail = ArticleSummary & {
  markdown: string;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
};

export class BlogApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new BlogApiError(0, "API_UNAVAILABLE", `无法连接文章服务：${String(error)}`);
  }

  if (!response.ok) {
    let code: string | null = null;
    let message = `文章服务返回 ${response.status}`;
    try {
      const body = (await response.json()) as { code?: string; message?: string };
      code = body.code ?? null;
      message = body.message ?? message;
    } catch {
      // Keep the status-based message when the body is not JSON.
    }
    throw new BlogApiError(response.status, code, message);
  }

  return (await response.json()) as T;
}

/** Public article list. Returns an empty list only when the backend is reachable and has no articles. */
export const getArticleSummaries = cache(async (): Promise<ArticleSummary[]> => {
  return request<ArticleSummary[]>("/articles");
});

/** Public article detail. Returns null for a missing or non-published slug. */
export const getArticle = cache(async (slug: string): Promise<ArticleDetail | null> => {
  try {
    return await request<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) return null;
    throw error;
  }
});

export function formatArticleDate(value: string | null | undefined): string {
  if (!value) return "未设置日期";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export function articleCover(article: Pick<ArticleDetail, "cover">): string {
  return article.cover || siteConfig.defaultPostCover;
}
