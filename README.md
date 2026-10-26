# Zpero の 小站

当前阶段：前端已直接采用 XinghuisamaBlogs 源码作为基底并完成 Zpero 品牌化；后端文章主链路与邮箱注册登录已实现。互动和管理功能仍在开发。

## 前端

需要 Node.js >=20.9。在 alice-blog-web 目录运行：

```powershell
npm install
npm run dev
```

打开 http://localhost:3000 。当前主要入口为首页、/timeline 文章归档、/posts/[slug] 文章详情和 /about。前端使用 XinghuisamaBlogs 的原始组件、动效和布局体系，Zpero 的文章副本位于 alice-blog-web/posts；正式联调后再切换到 Spring Boot 文章接口。来源和修改说明见 THIRD_PARTY_NOTICES.md 与 alice-blog-web/ZPERO_ADAPTATION.md。

## 后端与数据库

需要 JDK 21、Maven >=3.6.3、Docker Compose。本机 JDK 21 位于 `D:\Java\Java21`；如果终端仍显示 Java 17，请让 `JAVA_HOME` 与 PATH 优先指向该目录。

1. 将 deploy/.env.example 复制为 deploy/.env 并替换口令。
2. 在 deploy 运行 docker compose up -d。
3. 在后端终端设置 DB_PASSWORD 为上述应用用户密码，然后进入 alice-blog-server，运行 mvn spring-boot:run。
4. GET http://localhost:8080/api/v1/health 检查服务。

后端已建立 Spring Security、CSRF、Session JDBC、MyBatis-Plus、OpenAPI 与 Flyway 基础。公开文章、分类、标签接口已实现；管理员 Markdown 同步支持 Front Matter 校验、内容哈希、按 slug 更新、失败隔离、首次发布通知和审计日志。邮箱验证码注册、密码登录、退出和当前用户接口已实现。开发环境验证码写入后端日志；生产环境必须设置 REGISTRATION_ENABLED=false，直到配置真实邮件服务，并替换 VERIFICATION_PEPPER。Flyway 执行 V1 业务表、V2 Session 表迁移。MySQL 数据通过命名卷持久化。

## 尚待实施

- 浏览去重、点赞收藏、两级评论。
- 订阅通知、管理统计与评论审核。
- 博主提供的背景图、头像与真实文章。
- 后端集成测试、浏览器视觉验收与生产 HTTPS 配置。

当前使用原创 CSS 渐变与代码图形，无外部图片或参考仓库代码。未配置生产域名、未上线。

