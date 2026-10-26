# ZperoSite 页面重构与性能优化交接

<!-- project-handoff-id: PH-20261026-zpero-ui-01 -->

## 1. 交接状态

- 状态：材料已核对，等待接手 AI 核验后执行。
- 更新时间：2026-10-26（Asia/Shanghai）。
- 项目目录：`D:\ZperoSite`。
- 本文只制定任务和更改方案；本轮未实施页面重构、Git 初始化或 GitHub 推送。
- 之前用于预览的本地开发服务已经停止，接手者可自行重新启动。

## 2. 总目标

把现有博客首页重构为参考图所示的“全屏壁纸 + 中央深色半透明亚克力菜单页”，删除顶部导航栏，把文章、时间线、项目、关于、收藏、通知、登录/个人中心等入口改成可跳转的菜单卡片，并加入 GitHub 贡献热力图。同时解决首屏和滚动明显卡顿，最后建立本地 Git 版本控制并上传到用户指定的 GitHub 仓库。

完成标准：

1. 首页无顶部固定导航，信息结构与参考图接近，但不机械复制文字、图标或品牌素材。
2. 壁纸全屏显示，主容器和内容区为统一的深色半透明亚克力风格。
3. 首页滚动没有明显掉帧；生产构建中不再存在滚动触发的逐帧 React 状态更新。
4. GitHub 热力图可以显示指定用户近一年的贡献数据，并有加载、错误和空状态。
5. 五张本地壁纸经过 Web 优化后接入，不能直接把 5120px 原图作为首屏资源发送。
6. 桌面端、平板和手机布局可用，键盘操作、对比度和减少动态效果设置可用。
7. 前后端构建/测试通过，仓库中没有密钥、数据库文件或构建产物。
8. 本地 Git 历史清晰，并成功推送到用户指定的 GitHub 仓库。

## 3. 用户已经确认的决定

- 项目放在 `D:\ZperoSite`。
- Java 21 已在本机环境变量中配置。
- 现有前端基于 `heiehiehi/XinghuisamaBlogs` 的布局和风格继续改造。
- 新首页参考图：`C:\Users\Zpero\AppData\Local\Temp\codex-clipboard-021a2a38-4127-4e86-b5f6-3edd8fff652a.png`。
- 删除上方导航栏，改造成类似参考图的菜单页。
- 每个内容部分使用深色半透明亚克力；整体为全屏壁纸背景。
- 站点模块改为可跳转导航，并加入 GitHub 热力图。
- 可使用以下五张图片作为壁纸：
  - `C:\Users\Zpero\Pictures\siteWallpaper\【哲风壁纸】Q版-动漫角色.jpg`（2358×1272，约 1.19 MB）
  - `C:\Users\Zpero\Pictures\siteWallpaper\【哲风壁纸】奥特曼-气泡-水下.jpg`（5120×2320，约 4.92 MB）
  - `C:\Users\Zpero\Pictures\siteWallpaper\【哲风壁纸】二次元少女-动漫插画.jpg`（2912×1536，约 1.94 MB）
  - `C:\Users\Zpero\Pictures\siteWallpaper\【哲风壁纸】少女-星野-泳装.jpg`（3517×2202，约 3.64 MB）
  - `C:\Users\Zpero\Pictures\siteWallpaper\【哲风壁纸】云朵-伊蕾娜-窗边.jpg`（2561×1601，约 1.60 MB）
- 要建立本地 Git 版本控制并上传 GitHub。

## 4. 当前项目事实

- 前端：`D:\ZperoSite\alice-blog-web`
- 后端：`D:\ZperoSite\alice-blog-server`
- 前端备份：`D:\ZperoSite\alice-blog-web-before-xhblogs`
- 前端当前来源基线：XinghuisamaBlogs commit `8633e983371acc3b627b88b911143ff0fd31ea23`。
- 项目根目录和前端目录当前都没有 `.git`。
- 全局 Git 身份已配置：`Zpero <Zpero6@outlook.com>`。
- 本机当前没有可用的 `gh` CLI。
- 前端之前执行过生产构建并成功；存在 Turbopack 关于 `app/tree/page.tsx` 的 NFT 警告。
- 当前 Next 配置使用 `typescript.ignoreBuildErrors: true`，不能把“构建成功”当成类型检查完全通过。
- 后端此前测试通过。
- `/`、`/timeline`、`/posts/building-zpero-site`、`/about` 之前均验证返回 200。

## 5. 卡顿诊断

### 5.1 页面整体卡顿的主要原因

`alice-blog-web/app/layout.tsx` 在所有页面全局挂载了多项持续运行或高合成成本的效果：

- `BackgroundEffects`
- `DanmakuBackground`
- `FloatingPlayer`
- `GlobalToolbox`
- `ClickEffect`
- `CyberCat`
- 全屏 `backdrop-blur-md`
- 15 秒无限渐变动画
- 全局 `transition-colors duration-1000`

相关组件还叠加了以下工作量：

- `Fireflies.tsx`：约 50 个持续动画元素，含阴影和嵌套动画。
- `Sakura.tsx`：约 40 个持续下落花瓣。
- `WindyGrass.tsx`：约 150 根持续动画草叶。
- `DanmakuBackground.tsx`：约 15 条无限移动文字。
- `ClickEffect.tsx`：Canvas 的 `requestAnimationFrame` 即使没有点击波纹也一直执行；清理逻辑没有取消 RAF。
- `CyberCat.tsx`：多组无限精灵动画。
- `BackgroundSlider.tsx`：多张全屏图片同时存在并交叉淡入淡出，增加解码、显存和合成开销。
- `SplashScreen.tsx` 与 `PageTransition.tsx`：首访包含较长遮罩、模糊、缩放和位移动画，容易被用户感知为“加载卡住”。
- 多层父子元素同时使用 `backdrop-filter`，使浏览器在滚动时反复合成大面积模糊区域。

结论：这是 GPU 合成、动画数量、图片解码、Canvas 常驻循环和 React 更新叠加造成的系统性问题，不能只靠一处 `debounce` 解决。

### 5.2 导航栏下滑卡顿的直接原因

`alice-blog-web/components/Navbar.tsx` 在滚动回调中调用 `setLastScrollY(currentScrollY)`。因此几乎每个 scroll 事件都会：

1. 更新 React state；
2. 触发导航栏重新渲染；
3. 因 effect 依赖 `lastScrollY`，反复注销并重新注册 scroll listener；
4. 同时重新合成固定定位、`backdrop-blur-xl`、`transition-all duration-500` 的大面积透明层。

这条链路又与背景粒子、Canvas、壁纸和其他无限动画竞争主线程/GPU，所以滚动时最明显。新设计已经要求删除顶部导航栏，建议直接移除该组件及滚动监听。内部页面如需导航，只保留一个不监听滚动的“返回菜单”按钮或窄型静态工具条。

## 6. 建议的新页面结构

### 桌面端

- 页面最外层：固定全屏壁纸、静态暗色遮罩；不要给壁纸本身施加实时大半径模糊。
- 中央菜单壳：最大宽度约 1180–1280px，单层亚克力背景，圆角、低透明白边和柔和阴影。
- 12 列布局：左侧约 3 列，右侧约 9 列。
- 左侧：头像/昵称/一句简介、运行状态、简短时间线或站点统计。
- 右侧顶部：站点标题、状态标签、简短公告、少量外链按钮。
- 右侧中部：GitHub 贡献热力图。
- 下部“站点”：文章、时间线、项目、关于、收藏、通知、登录/个人中心等导航卡片。
- 下部“技能”：Java 21、Spring Boot、Spring Cloud、MySQL、Redis、Docker、Git、Next.js、TypeScript、AI 等图标网格。只展示用户确认或设计初稿已有的技能，不虚构熟练程度。
- 底部：版权和备案/链接区域。

### 移动端

- 改为单列；身份区压缩成横向头部。
- 菜单卡片两列，极窄屏降为一列。
- 热力图可横向滚动或使用较小单元格，不能压缩到不可读。
- 避免多层亚克力：移动端可自动降低或关闭 `backdrop-filter`，改用较高不透明度纯色背景。

### 建议色调

- 基础背景：深蓝黑/石墨色，建议 `rgba(9, 17, 29, 0.62–0.76)`。
- 边框：`rgba(255, 255, 255, 0.10–0.16)`。
- 正文：冷白；次要文字：蓝灰。
- 强调色：青蓝为主，少量绿色用于在线/成功状态。
- 每张壁纸允许通过 CSS 变量提供轻微色调适配，但不要让每张卡片拥有互相冲突的随机色。

## 7. 执行任务清单

### P0：基线、备份和版本控制

- [ ] 接手后先阅读本文并执行 `git status`/目录核验；不要假设已有 Git 仓库。
- [ ] 在 `D:\ZperoSite` 根目录建立统一仓库，使前端、后端、内容、部署与文档在同一历史中。
- [ ] 创建/核对根 `.gitignore`：忽略 `node_modules/`、`.next/`、`target/`、日志、IDE 文件、数据库卷、缓存、`.env` 和 `.env.*`（保留 `.env.example`）。
- [ ] 把 `alice-blog-web-before-xhblogs/` 作为本地备份排除在 Git 之外，避免仓库重复和体积膨胀。
- [ ] 核对无令牌、密码、私钥、真实生产配置或数据库文件后，再创建基线提交。
- [ ] 保留 `alice-blog-web/LICENSE`，新增根级 `THIRD_PARTY_NOTICES.md`，清楚标注上游前端及 CC BY-NC 4.0 许可。

### P1：建立性能基线

- [ ] 使用生产模式而不是只看开发模式：`npm run build` 后 `npm start`。
- [ ] 记录首页首屏、连续滚动 5–10 秒、切换壁纸三个场景的 Chrome Performance/Lighthouse 数据。
- [ ] 记录长任务、主线程脚本、帧率、内存/显存趋势、LCP、CLS 和 INP，保存优化前截图或 JSON。
- [ ] 用 React Profiler 确认滚动时 Navbar 和全局 Provider 的重复渲染次数。

### P2：先做性能减法

- [ ] 从全局布局中移除 Navbar、Danmaku、Fireflies、Sakura、WindyGrass、常驻 ClickEffect、CyberCat 和不必要的页面入场遮罩。
- [ ] FloatingPlayer、GlobalToolbox 等非核心组件默认不挂载；确需保留时只在用户主动打开后懒加载。
- [ ] 若保留 Canvas 效果：空闲时停止 RAF，页面隐藏时暂停，卸载时 `cancelAnimationFrame`。
- [ ] 移除全局 `transition-all`；动画只声明 `opacity`/`transform`，并控制在 150–250ms。
- [ ] 添加 `prefers-reduced-motion`：关闭壁纸轮播、淡入和非必要动画。
- [ ] 下方离屏模块使用 `content-visibility: auto`/合理 `contain`，但避免影响可访问性和定位。
- [ ] 全页最多保留一个主要 `backdrop-filter` 合成层；内部卡片优先使用透明色，不要嵌套模糊。

### P3：首页结构重构

- [ ] 重写 `app/page.tsx` 为菜单型 Dashboard，不再延续纵向大段落首页。
- [ ] 建议拆分组件：`WallpaperLayer`、`MenuShell`、`IdentityPanel`、`StatusPanel`、`ContributionHeatmap`、`NavigationGrid`、`SkillsGrid`。
- [ ] 将现有站点功能映射为真实路由；未完成的入口要隐藏、标注“规划中”或落到明确的占位页，不能产生死链。
- [ ] 内页移除固定顶部导航，增加静态返回菜单入口和必要的文章面包屑。
- [ ] 保持原项目的动漫、轻量、圆角视觉气质，但更换配色和信息布局，避免逐像素复制参考站的专属素材与品牌。

### P4：壁纸资源管线

- [ ] 从用户目录复制五张图片到项目资源流程中，并重命名为 ASCII 文件名。
- [ ] 生成 AVIF/WebP 桌面与移动版本（建议桌面长边 1920/2560、移动长边 1080/1440），根据观感控制质量。
- [ ] 首屏只预加载当前壁纸；仅预解码下一张，DOM 中最多保留当前和下一张。
- [ ] 轮播间隔建议 15–20 秒；标签页隐藏时暂停；减少动态效果时固定一张。
- [ ] 使用 `cover` 并为每张图配置合理 `object-position`，避免人物主体被裁掉。
- [ ] 首屏图片总传输量以小于约 1.5 MB 为目标，禁止直接发送 5120px 原图。
- [ ] 上线前确认这些壁纸具备公开展示和再分发权限；不确定时只在本地使用或换成已授权资源。

### P5：GitHub 热力图

- [ ] 先向用户取得 GitHub 用户名。
- [ ] 推荐方案：服务端调用 GitHub GraphQL contribution calendar，令牌仅放服务端环境变量，并缓存约 6 小时。
- [ ] 可选轻量方案：`react-github-calendar` 或公开第三方接口；使用前说明第三方可用性和隐私依赖。
- [ ] 组件需提供 loading、error、empty、重试和 365 天数据展示。
- [ ] 每个格子应有日期和贡献次数的可访问标签/tooltip；颜色与站点青蓝/绿色调统一。
- [ ] 不要把 GitHub token 放入浏览器 bundle、源码或 Git 历史。

### P6：质量与回归

- [ ] 修复现有 TypeScript 问题，尽量移除 `typescript.ignoreBuildErrors: true` 后再构建。
- [ ] 执行前端 lint、类型检查、生产构建；执行后端 Java 21 测试。
- [ ] 验证首页、文章、时间线、项目、关于、收藏、通知、登录/个人中心和管理入口权限。
- [ ] 测试 1440p、1080p、768px、390px 等宽度，以及 Windows 125%/150% 缩放。
- [ ] 检查键盘焦点、点击热区、正文对比度、屏幕阅读器标签和减少动态效果。
- [ ] 优化后重新采集与 P1 相同的性能数据，并形成前后对比。

### P7：GitHub 发布

- [ ] 用户提供现有仓库 URL，或明确授权创建新仓库并给出仓库名、公开/私有设置。
- [ ] 本机没有 `gh` CLI；可由用户先创建仓库后提供 HTTPS/SSH 地址，或在明确授权后安装并登录 `gh`。
- [ ] 建议提交顺序：`baseline` → `performance cleanup` → `menu redesign` → `heatmap and wallpapers` → `qa/docs`。
- [ ] 推送前再次扫描秘密和大文件，确认许可证/壁纸权限说明完整。
- [ ] 添加 remote 后执行 `git push -u origin main`，并验证 GitHub 页面文件、README、许可证和提交历史正常。

## 8. 性能验收门槛

- 首页滚动不触发持续 React state 更新；React Profiler 中滚动时菜单壳无无意义高频重渲染。
- 普通桌面环境连续滚动目标接近 60 FPS，5 秒滚动录制中不出现由本站脚本造成的密集 >50ms 长任务。
- 生产构建 Lighthouse 参考目标：桌面 Performance ≥ 85，移动 Performance ≥ 75；若硬件或环境导致未达标，必须附瓶颈记录。
- LCP 目标 ≤ 2.5s（在统一测试条件下比较），CLS ≤ 0.1。
- 首页仅保留必要动画；开启“减少动态效果”后无自动轮播和持续装饰动画。
- 大面积实时 `backdrop-filter` 不超过一个主要层级，移动端允许降级为半透明纯色。
- 路由无死链，未登录/普通用户/管理员三种状态显示正确。

## 9. 尚需用户提供的信息

- GitHub 用户名（热力图数据源）。
- 要推送的 GitHub 仓库 URL；若新建，还需仓库名和公开/私有选择。
- 五张壁纸是否允许公开提交到 GitHub；若版权不明确，建议只提交优化脚本和占位资源。
- 菜单中“项目、收藏、通知”等未完成模块是隐藏、标记“规划中”，还是先做占位页。

## 10. 接手 AI 的第一步

1. 阅读本文并检查 `D:\ZperoSite` 实际目录、未提交文件和配置；不要覆盖用户已有修改。
2. 用生产模式复现并记录卡顿基线。
3. 核对 `.gitignore` 和敏感信息后，在根目录建立 Git 基线提交。
4. 先完成 P2 的性能减法，再做 P3 的视觉重构；不要一边保留全部旧特效一边叠加新亚克力布局。
5. 在需要 GitHub 用户名、仓库地址和壁纸公开授权时向用户询问，不得自行猜测。

## 11. 可直接复制给下一位 AI 的提示词

> 请接手 `D:\ZperoSite`，先完整阅读 `D:\ZperoSite\PROJECT_STATE.md` 并核验实际文件。目标是按文档把首页重构成全屏壁纸、中央深色半透明亚克力菜单页，删除顶部导航和高开销全局特效，解决页面与滚动卡顿，加入 GitHub 贡献热力图，优化五张本地壁纸，完成响应式和可访问性测试。先建立生产性能基线与根级 Git 基线，再按 P2 到 P7 分阶段实施。不要暴露 GitHub token，不要把备份目录、构建产物或密钥提交进仓库；遇到 GitHub 用户名、仓库 URL、公开权限或壁纸授权缺失时向我确认。每完成一个阶段都运行相应构建/测试并报告具体文件、指标和遗留问题。

