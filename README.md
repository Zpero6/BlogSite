# Zpero Blog

这是 Zpero 的个人博客，使用 Astro Content Collections 构建，部署到 Cloudflare Pages。

## 项目结构

```text
.github/workflows/deploy-pages.yml  # GitHub Actions 构建并发布到 Cloudflare Pages
zpero-astro/                         # Astro 博客应用
```

文章内容位于 `zpero-astro/src/content/blog/`，封面和文章图片位于
`zpero-astro/src/assets/` 与 `zpero-astro/public/images/`。

## 本地开发

要求 Node.js 20.9 或更高版本。

```powershell
cd zpero-astro
npm install
npm run dev
```

构建检查：

```powershell
cd zpero-astro
npm run check
npm run build
```

## 发布

推送到 `main` 后，GitHub Actions 会自动构建 `zpero-astro` 并发布到 Cloudflare Pages：

<https://zpero-site.pages.dev/>

## 当前文章

- MySQL 八股笔记：事务、MVCC 与索引
- 有了 Volatile 为什么还要加锁？
- CAS 是如何实现原子操作的？

## 许可证与致谢

字体、DansBlog 设计参考和其他第三方资源说明见
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。
