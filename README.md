# Zpero の 小站

当前阶段：首页已重构为“全屏柔焦壁纸 + 彼此分离的深色亚克力菜单岛”，移除了全局高开销特效与滚动监听导航；站点入口改为左侧文字、右侧本地插画的卡片。所有公开内页共享同一模糊壁纸，并使用统一的亚克力内容层与“返回菜单”入口。后端文章主链路与邮箱注册登录已实现，互动和管理功能仍在开发。

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

页面与素材说明：

- 壁纸资源位于 `public/wallpapers/`，由 `npm run wallpapers` 从本地原图生成 AVIF/WebP 的 1920/1080 长边版本，以及预模糊的 `-blur` 变体。站点背景直接使用预模糊版本，避免全屏运行时 `filter: blur()`。原图不进入仓库。
- 背景每 12 秒在五张壁纸之间切换；图片完成加载后才开始淡入。开启系统“减少动态效果”时改为瞬时切换，不播放淡入动画。
- 站长头像由 `C:\Users\Zpero\Pictures\WallPaper\站长头像.jpeg` 生成 320×320 WebP 与 256×256 PNG，位于 `public/images/zpero-avatar.*`。
- 导航卡片插画位于 `public/images/nav/`，由 `node scripts/generate-nav-art.mjs` 生成，是本地占位猫贴纸；替换规则见该目录 README。
- 首页为静态渲染并每 6 小时重新验证；生产构建 TypeScript 检查已开启，不再使用 `ignoreBuildErrors`。
- 内页由 `components/InnerPageShell.tsx` 统一提供顶部返回菜单和单层亚克力容器；背景在根布局挂载一次，始终固定。
- 响应式截图可用 `scripts/capture-screenshots.mjs`（需要先启动带 `--remote-debugging-port=9222` 的 Chrome）。
- 壁纸轮播可用 `scripts/check-rotation.mjs` 验证（需要 Chrome 调试端口 9223）。
- 性能参考（本机 Lighthouse 13，生产模式）：桌面 Performance 100 / 可访问性 100，移动 Performance 99 / 可访问性 100，移动 LCP 2.1s、CLS 0、TBT 20ms。时间线、文章详情、关于、照片墙的可访问性复查均为 100。

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
