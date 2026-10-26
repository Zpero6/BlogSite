# Zpero の 小站

当前阶段：首页已重构为“全屏壁纸 + 中央深色半透明亚克力菜单页”，移除了全局高开销特效与滚动监听导航；文章、时间线、项目、关于、收藏、通知、个人中心等入口已统一到菜单卡片。后端文章主链路与邮箱注册登录已实现，互动和管理功能仍在开发。

远程仓库：https://github.com/Zpero6/BlogSite

## 前端

需要 Node.js >=20.9。在 alice-blog-web 目录运行：

```powershell
npm install
npm run dev
```

打开 http://localhost:3000 。主要入口为首页、`/timeline` 文章归档、`/posts/[slug]` 文章详情、`/about`、`/projects`、`/chatter`、`/moments`、`/photowall`、`/music`、`/friends` 和 `/tree`。收藏、通知、个人中心当前落到 `/soon/*` 占位页。

常用检查：

```powershell
npm run typecheck
npm run build
npm start
npm run lighthouse:desktop
npm run lighthouse:mobile
```

首页说明：

- 壁纸资源位于 `public/wallpapers/`，由 `npm run wallpapers` 从本地原图生成 AVIF/WebP 的 1920/1080 两个长边版本。原图不进入仓库。
- GitHub 贡献热力图读取 `Zpero6` 的公开贡献日历 HTML，服务端缓存 6 小时，无需 token；失败时提供重试。
- 首页为静态渲染并每 6 小时重新验证；生产构建 TypeScript 检查已开启，不再使用 `ignoreBuildErrors`。
- 性能参考（本机 Lighthouse 13，生产模式）：桌面 Performance 100 / 可访问性 100，移动 Performance 97 / 可访问性 100，移动 LCP 约 2.6s。移动端 LCP 略高于 2.5s 目标，主要受 React hydration 与移动网络模拟下的 JS 下载影响。

来源和修改说明见 THIRD_PARTY_NOTICES.md、alice-blog-web/ZPERO_ADAPTATION.md 与 alice-blog-web/LICENSE。

## 后端与数据库

需要 JDK 21、Maven >=3.6.3、Docker Compose。本机 JDK 21 位于 `D:\Java\Java21`；如果终端仍显示 Java 17，请让 `JAVA_HOME` 与 PATH 优先指向该目录。

1. 将 deploy/.env.example 复制为 deploy/.env 并替换口令。
2. 在 deploy 运行 docker compose up -d。
3. 在后端终端设置 DB_PASSWORD 为上述应用用户密码，然后进入 alice-blog-server，运行 mvn spring-boot:run。
4. GET http://localhost:8080/api/v1/health 检查服务。

后端已建立 Spring Security、CSRF、Session JDBC、MyBatis-Plus、OpenAPI 与 Flyway 基础。公开文章、分类、标签接口已实现；管理员 Markdown 同步支持 Front Matter 校验、内容哈希、按 slug 更新、失败隔离、首次发布通知和审计日志。邮箱验证码注册、密码登录、退出和当前用户接口已实现。开发环境验证码写入后端日志；生产环境必须设置 `REGISTRATION_ENABLED=false`，直到配置真实邮件服务，并替换 `VERIFICATION_PEPPER`。Flyway 执行 V1 业务表、V2 Session 表迁移。MySQL 数据通过命名卷持久化。

## 尚待实施

- 浏览去重、点赞收藏、两级评论。
- 订阅通知、管理统计与评论审核。
- 收藏、通知、个人中心的前端页面与后端联调。
- 后端集成测试、浏览器视觉验收与生产 HTTPS 配置。

壁纸由站点所有者提供并授权公开使用，详见 `alice-blog-web/public/wallpapers/README.md`。未配置生产域名、未上线。
