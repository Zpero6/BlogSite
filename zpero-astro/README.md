# Zpero Site

一个以桌面原型为视觉基准的精简个人博客。项目使用 Astro 静态生成，文章与封面都保存在 GitHub 仓库中，提交后由 Cloudflare Pages 自动构建和发布。

## 本地运行

需要 Node.js 24。

```bash
npm install
npm run dev
```

正式构建与检查：

```bash
npm run build
```

生成结果位于 `dist/`。

## 发布一篇文章

1. 在 `src/content/blog/` 新建一个 Markdown 文件，例如 `my-new-post.md`。
2. 在 `src/assets/covers/` 放入封面，例如 `my-new-post.webp`。
3. 在文章开头填写：

```yaml
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-10-30
category: 随笔
tags: [Astro, 博客]
cover: my-new-post.webp
coverAlt: 封面图片说明
draft: false
---
```

`cover` 明确告诉网站哪张图片是文章封面。若省略它，网站会依次查找与文章同名的 `.webp`、`.png`、`.jpg`、`.jpeg` 或 `.avif` 图片；仍未找到时使用默认封面。若填写了一个不存在的文件名，构建会直接失败，避免发布出错。

提交并推送到 GitHub 后，Cloudflare Pages 会自动重新部署。

## Cloudflare Pages 设置

- Production branch：`main`
- Build command：`npm run build`
- Build output directory：`dist`
- Environment variable：`SITE_URL=https://你的域名`（建议填写）

自定义域名在 Cloudflare Pages 项目的 **Custom domains** 中添加。若 DNS 也托管在 Cloudflare，记录会自动配置。

## 当前范围

- 首页、文章列表、文章详情、项目页、关于页、搜索和 RSS
- Markdown 文章与仓库内封面图片
- 全静态输出，无数据库、登录、管理后台和 Worker 后端
