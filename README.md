# Zpero の 小站

当前阶段：首页已按参考图调整为“明亮柔焦壁纸 + 分离的烟灰玻璃菜单浮层”，移除了全局高开销特效与滚动监听导航。大标题、状态行、提示条、快捷按钮、热力图、四列站点卡片和技能图标直接悬浮在壁纸上；站点入口使用左侧文字、右侧本地语义插画。所有公开内页共享同一模糊壁纸，并使用统一的内容玻璃层与“返回菜单”入口。后端文章主链路、邮箱注册登录、浏览去重、点赞收藏、两级评论、订阅通知和管理员统计/评论审核均已实现，并完成本机 MySQL 与浏览器联调。

远程仓库：https://github.com/Zpero6/BlogSite

## 前端

需要 Node.js >=20.9。在 alice-blog-web 目录运行：

```powershell
npm install
npm run dev
```

打开 http://localhost:3000 。主要入口为首页、`/timeline` 文章归档、`/posts/[slug]` 文章详情、`/favorites`、`/notifications`、`/about`、`/projects`、`/chatter`、`/moments`、`/photowall`、`/music`、`/friends`、`/login`、`/register`、`/account`、`/admin`、`/admin/sync`、`/admin/comments` 和 `/tree`。旧的 `/soon/*` 仅保留历史占位路由。

文章页面不再读取本地 Markdown：

```text
content/posts → 管理员同步 → MySQL → Java API → Next.js 页面
```

前端通过 `next.config.ts` 把 `/api/v1/*` 代理到 `API_BASE_URL`（默认 `http://127.0.0.1:8080`）。服务端组件直接请求该地址；浏览器端登录、CSRF 和同步请求走同源代理。旧的 `alice-blog-web/posts` 已移动到 `content/legacy-web-posts` 归档，不再参与页面渲染。生产环境请设置 `SITE_URL`，`sitemap.xml`、`robots.txt` 和 Open Graph 的绝对地址会使用它；本地默认 `http://localhost:3000`。

常用检查：

```powershell
npm run typecheck
npm run build
npm start
npm run lighthouse:desktop
npm run lighthouse:mobile
```

页面与素材说明：

- 壁纸资源位于 `public/wallpapers/`，由 `npm run wallpapers` 从本地原图生成 AVIF/WebP 的 1920/1080 长边版本，以及 `-blur-v2` 预模糊变体（0.96 brightness / 0.94 saturation / 16px 桌面、12px 移动）。站点背景直接使用预模糊版本，避免全屏运行时 `filter: blur()`。原图不进入仓库。
- 背景每 10 秒切换一次。轮播使用两个稳定合成槽：底层始终 `opacity: 1`，上层预载下一张后只让 opacity 从 0 升到 1，持续 2.2 秒；结束后在遮住的情况下更新底层，再无动画复位上层。开启“减少动态效果”时改为瞬时换图。
- 站长头像由 `C:\Users\Zpero\Pictures\WallPaper\站长头像.jpeg` 生成 320×320 WebP 与 256×256 PNG，位于 `public/images/zpero-avatar.*`。
- 导航卡片插画位于 `public/images/nav/`，由 `node scripts/generate-nav-art.mjs` 生成，是 11 个语义不同的本地占位贴纸；替换规则见该目录 README。
- 技能图标使用 `simple-icons` 的真实品牌图形，保留品牌色；只展示现有技术栈，不标注熟练度。
- 首页、时间线、文章详情和关于页为动态渲染，直接读取 Java API；API 不可用时首页/时间线显示空状态或错误提示。生产构建 TypeScript 检查已开启，不再使用 `ignoreBuildErrors`。
- `app/sitemap.ts` 会根据公开文章接口生成 `/sitemap.xml`，`app/robots.ts` 会屏蔽登录、收藏、通知、后台和 API 路径；生产环境通过 `SITE_URL` 设置绝对域名。
- 内页由 `components/InnerPageShell.tsx` 统一提供顶部返回菜单和单层内容玻璃；背景在根布局挂载一次，始终固定。
- 响应式截图可用 `scripts/capture-screenshots.mjs`；布局溢出可用 `scripts/check-layout.mjs`；轮播帧与减少动态效果可用 `scripts/verify-carousel.mjs`，五张壁纸逐张截图可用 `scripts/capture-wallpaper-cycles.mjs`（需要先启动带 `--remote-debugging-port=9223` 的 Chrome）。
- 登录后的点赞、收藏、评论、回复、订阅、收藏页、通知页、管理后台可用 `scripts/verify-ui-interactions.mjs` 做浏览器验收。它需要 `BASE_URL`、`ADMIN_EMAIL`、`ADMIN_PASSWORD`，并会写入测试互动数据，跑完需清理。
- 性能参考（本机 Lighthouse 13，生产模式）：桌面 Performance 100 / 可访问性 100，移动 Performance 99 / 可访问性 100，移动 LCP 2.3s、CLS 0、TBT 20ms。移动 LCP 元素是首页头像；可访问性无失败项。

来源和修改说明见 THIRD_PARTY_NOTICES.md、alice-blog-web/ZPERO_ADAPTATION.md 与 alice-blog-web/LICENSE。

## 后端与数据库

需要 JDK 21、Maven >=3.6.3、MySQL 8（Docker Compose 或本机服务均可）。

### 1. 准备数据库

Docker 方式：

1. 将 `deploy/.env.example` 复制为 `deploy/.env` 并替换口令。
2. 在 `deploy` 目录运行 `docker compose up -d`。

本机 MySQL 方式（示例，按自己的口令替换）：

```sql
CREATE DATABASE zpero_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE zpero_blog_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'zpero'@'localhost' IDENTIFIED BY '<应用密码>';
GRANT ALL PRIVILEGES ON zpero_blog.* TO 'zpero'@'localhost';
GRANT ALL PRIVILEGES ON zpero_blog_test.* TO 'zpero'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 配置并启动后端

在 `alice-blog-server` 目录设置环境变量后运行：

```powershell
$env:DB_PASSWORD = "<应用密码>"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "<至少 8 位的管理员密码>"
mvn spring-boot:run
```

- Flyway 自动执行 `V1` 业务表、`V2` Spring Session 表和 `V3` 文章封面列。
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` 只在启动时用于初始化管理员：账号不存在则创建；已存在的普通账号会被提升为管理员，密码不会被改写。
- `GET http://localhost:8080/api/v1/health` 返回服务和数据库状态；`/swagger-ui.html` 可查看接口。
- 开发环境验证码写入后端日志（搜索 `DEV EMAIL CODE`）。正式开放注册前必须接入邮件服务，并设置 `REGISTRATION_ENABLED=false`、替换 `VERIFICATION_PEPPER`。
- 修改后端 Java 代码后需要重启 Spring Boot；IntelliJ 中正在运行的旧实例不会自动加载新 class。

### 3. 主链路验收

1. 打开 `http://localhost:3000/register`，获取验证码（后端日志），注册后应自动登录。
2. 刷新页面，`/account` 仍显示当前用户；退出后访问 `/account` 显示未登录。
3. 用管理员账号登录，打开 `/admin/sync`，点击“开始同步”。
4. 首页“最近更新”、`/timeline` 和 `/posts/[slug]` 应显示 `content/posts` 中的已发布文章；草稿不出现在公开接口。
5. 再次同步应返回 `UNCHANGED`，不会重复建文章；修改 Markdown 后同步应返回 `UPDATED`。
6. 普通用户访问 `POST /api/v1/admin/markdown/sync` 应返回 403。
7. 打开文章详情，浏览同一篇文章不会重复增加阅读量；登录后点赞/取消点赞、收藏/取消收藏，重复点击不会重复计数。
8. `/favorites` 显示当前用户收藏的文章，可直接取消收藏。
9. 在文章页发表评论、回复评论；回复的回复仍挂在同一个顶级评论下。删除自己的评论后显示“该评论已删除”占位。
10. 登录后点击“订阅本站”，再让管理员首次发布一篇新文章；`/notifications` 应出现未读通知，可标记已读。
11. 管理员打开 `/admin` 查看统计，打开 `/admin/comments` 隐藏或删除评论；隐藏后文章页不再显示该评论。

### 4. 集成测试

集成测试连接真实 MySQL，会先执行 Flyway clean，只能指向测试库：

```powershell
$env:RUN_MYSQL_IT = "true"
$env:DB_USER = "zpero"
$env:DB_PASSWORD = "<应用密码>"
mvn test -Dtest=MainFlowIntegrationTest
```

默认测试库为 `zpero_blog_test`，可用 `TEST_DB_URL`、`TEST_DB_USER`、`TEST_DB_PASSWORD` 覆盖。运行前必须由 MySQL 管理员创建测试库并授予应用账号权限；测试会执行 Flyway clean，绝不能指向 `zpero_blog`。如果不想改动本机主库账号权限，也可以启动一个独立的临时 MySQL 实例（例如 3307 端口），通过 `TEST_DB_URL` 指向它。未设置 `RUN_MYSQL_IT=true` 时集成测试自动跳过，普通 `mvn test` 只运行解析器单元测试。

## 尚待实施

- 生产 HTTPS、真实邮件验证码和部署配置。
- 管理端文章列表/删除、通知批量管理、用户封禁等扩展功能。
- 全文搜索、OAuth、AI 助手等第二轮能力。
- 生产环境限流与审计加固。

壁纸由站点所有者提供并授权公开使用，详见 `alice-blog-web/public/wallpapers/README.md`。未配置生产域名、未上线。
