import PageTransition from '../../components/PageTransition';
import InnerPageShell from '../../components/InnerPageShell';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { ToastProvider } from '../../components/ToastProvider';
import { getArticleSummaries } from '../../lib/blogApi';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "归档与探索 | " + siteConfig.title,
};

type TimelinePost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
};

export default async function Timeline() {
  const posts: TimelinePost[] = [];
  const tagCounts: Record<string, number> = {};
  let loadError: string | null = null;

  try {
    const articles = await getArticleSummaries();
    articles.forEach((article) => {
      const postTags = article.tags.length > 0 ? article.tags : ['未分类'];
      postTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      posts.push({
        slug: article.slug,
        title: article.title || '无标题',
        date: article.publishedAt || '1970-01-01',
        description: article.summary || '',
        tags: postTags,
        cover: article.cover || siteConfig.defaultPostCover,
      });
    });

    posts.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDiff !== 0 ? dateDiff : b.slug.localeCompare(a.slug);
    });
  } catch (error) {
    console.error("读取后端文章列表失败", error);
    loadError = "暂时无法连接文章服务，请确认 Spring Boot 已启动后刷新页面。";
  }

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <ToastProvider>
      <InnerPageShell>
        <PageTransition>
          <TimelineClient posts={posts} tags={tagsArray} error={loadError} />
        </PageTransition>
      </InnerPageShell>
    </ToastProvider>
  );
}
