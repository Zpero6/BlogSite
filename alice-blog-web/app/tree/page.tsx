import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';
import { getArticleSummaries } from '../../lib/blogApi';

export const dynamic = 'force-dynamic';

type LocalItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  date: string;
  cover: string | null;
  content: string;
};

function getLocalItems(directoryName: string, typeName: string): LocalItem[] {
  const dirPath = path.join(process.cwd(), directoryName);
  let items: LocalItem[] = [];
  try {
    if (fs.existsSync(dirPath)) {
      const fileNames = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      items = fileNames.map(fileName => {
        const fullPath = path.join(dirPath, fileName);
        // 🌟 核心：把 content（正文内容）和 data（头部参数）解构出来！
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

        // 提取真正的文件名作为路由 slug
        const realSlug = fileName.replace(/\.md$/, '');

        return {
          id: data.id || realSlug,
          slug: realSlug, // 🌟 强制保留真实的 slug 供路由跳转使用
          title: data.title || '',
          type: typeName,
          date: data.date || '2026-05-01',
          // 🌟 核心修复：把 cover（封面图）提取出来传给前台！如果写的是 image 也兼容
          cover: data.cover || data.image || null,
          // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
          content: content.trim()
        };
      });
    }
  } catch (error) {
    console.error(`读取 ${directoryName} 失败:`, error);
  }
  return items;
}

async function getBackendPosts() {
  try {
    return (await getArticleSummaries()).map((article) => ({
      id: article.slug,
      slug: article.slug,
      title: article.title,
      type: 'post',
      date: article.publishedAt || '2026-05-01',
      cover: article.cover || null,
      content: article.summary || '',
    }));
  } catch (error) {
    console.error('读取后端文章失败', error);
    return [];
  }
}

export default async function CreativeWorkshopPage() {
  const posts = await getBackendPosts();
  const chatters = getLocalItems('chatters', 'chatter');
  const moments = getLocalItems('moments', 'moment');

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}