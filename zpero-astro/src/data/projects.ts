export const projects = [
  {
    id: 'blogsite',
    title: 'BlogSite',
    status: '持续维护中',
    description: '我的个人博客。用 Astro Content Collections 管理文章，记录 Java 后端学习、技术实践和项目过程，通过 GitHub Actions 发布到 Cloudflare Pages。',
    tech: ['Astro', 'Content Collections', 'Cloudflare Pages'],
    repository: 'https://github.com/Zpero6/BlogSite',
    website: 'https://zpero-site.pages.dev/',
  },
];
export type Project = (typeof projects)[number];
