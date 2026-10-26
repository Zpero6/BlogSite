export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type ContributionData = {
  username: string;
  days: ContributionDay[];
  total: number;
  fetchedAt: string;
};

export type ContributionResult =
  | { ok: true; data: ContributionData }
  | { ok: false; error: string };

const DEFAULT_USERNAME = process.env.GITHUB_USERNAME || "Zpero6";
const CACHE_SECONDS = 60 * 60 * 6;

/**
 * GitHub renders the public contribution calendar as HTML. Reading that page
 * avoids shipping a personal access token and keeps the data first-party.
 * The response is cached for six hours on the server.
 */
export async function getContributions(options: {
  username?: string;
  noCache?: boolean;
} = {}): Promise<ContributionResult> {
  const username = options.username || DEFAULT_USERNAME;

  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return { ok: false, error: "GitHub 用户名格式无效" };
  }

  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;

  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: {
      Accept: "text/html",
      "User-Agent": "Zpero-Site/1.0 (+https://github.com/Zpero6/BlogSite)",
    },
    signal: AbortSignal.timeout(10_000),
  };

  if (options.noCache) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: CACHE_SECONDS };
  }

  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      return { ok: false, error: `GitHub 返回 ${response.status}` };
    }

    const html = await response.text();
    const days = parseContributionCalendar(html);

    if (days.length === 0) {
      return { ok: false, error: "未能读取贡献日历" };
    }

    const latest365 = days.slice(-365);

    return {
      ok: true,
      data: {
        username,
        days: latest365,
        total: latest365.reduce((sum, day) => sum + day.count, 0),
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "GitHub 响应超时"
        : "无法连接 GitHub";
    return { ok: false, error: message };
  }
}

function parseContributionCalendar(html: string): ContributionDay[] {
  const tooltipByTarget = new Map<string, number>();
  const tooltipPattern =
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;

  for (const match of html.matchAll(tooltipPattern)) {
    const target = match[1];
    const text = decodeHtmlText(match[2]);
    const countMatch = text.match(/(\d+)\s+contributions?/i);
    tooltipByTarget.set(target, countMatch ? Number(countMatch[1]) : 0);
  }

  const days: ContributionDay[] = [];
  const cellPattern = /<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/gi;

  for (const match of html.matchAll(cellPattern)) {
    const tag = match[0];
    const date = match[1];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0);

    days.push({
      date,
      level: Number.isFinite(level) ? level : 0,
      count: id ? tooltipByTarget.get(id) ?? 0 : 0,
    });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}
