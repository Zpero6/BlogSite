import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/posts';
import { SITE } from '../data/site';

export async function GET(context: { site?: URL }) {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? 'https://example.pages.dev',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
