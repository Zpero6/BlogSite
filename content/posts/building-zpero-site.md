---
title: 从零构建一个有边界的个人博客
slug: building-zpero-site
summary: 为什么从模块化单体出发，以及第一版应该做什么。
category: 架构设计
tags: [Spring Boot, 架构设计]
publishedAt: 2026-10-26
status: published
---

## 先明确问题，再选择技术

个人博客首先是一个内容产品。让访问者找到文章、读懂文章，比展示技术栈更重要。

这是用于验证页面排版的示例文章，不代表已经完成的项目复盘。

## 第一版的边界

- Next.js 负责页面、SEO 和阅读体验。
- Spring Boot 负责认证、互动和内容同步。
- MySQL 保存业务数据，Markdown 是文章内容源。

## 为什么选择模块化单体

单个应用降低了部署和联调成本。按照业务组织代码，让每个模块拥有自己的应用服务与数据访问逻辑。

```java
public record ArticlePublishedEvent(Long articleId) {}
```

## 演进方向

先完成文章发布与阅读闭环，再基于真实瓶颈引入缓存和异步消息。

