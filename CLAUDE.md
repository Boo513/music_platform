# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 交流语言

使用中文回答所有问题。

## 项目概述

在线音乐播放 Web 平台。用户上传 MP3 音乐并标注风格/情绪标签，播放时根据标签动态渲染沉浸式 3D 场景背景，配合粒子特效营造氛围感。

三层架构：React SPA → Spring Boot REST API → MySQL + 文件系统。8 种风格 × 6 种情绪 = 48 种场景组合。

完整设计文档：`docs/开发文档.md`

## 开发命令

### 前端 (React + TypeScript + Vite)

```bash
cd frontend
npm run dev          # 启动开发服务器 → localhost:5173
npx tsc --noEmit     # TypeScript 类型检查
npm run build        # 生产构建（仅 vite build，无 tsc，兼容 Netlify）
npx vitest run       # 运行全部测试
npx vitest           # 测试 watch 模式
npx vitest run src/stores/playerStore.test.ts  # 运行单个测试文件
```

Vite 代理配置：`/api` 和 `/uploads` 代理到 `localhost:8080`。
`vite.config.ts` 中 `allowedHosts: true`（允许所有 host，方便 cpolar/ngrok 等隧道访问）。

### 后端 (Spring Boot 3.5.14 + MyBatis)

```bash
# 环境变量（本地）
export JAVA_HOME="C:/Users/26489/.jdks/ms-17.0.17"
export PATH="$JAVA_HOME/bin:$PATH"
M2_HOME="C:/Users/26489/.m2/wrapper/dists/apache-maven-3.9.14/db91789b"

cd backend
"$M2_HOME/bin/mvn" compile          # 编译
"$M2_HOME/bin/mvn" spring-boot:run  # 启动 → localhost:8080
```

### MySQL

```
Port: 3306
User: root
Password: 123456
Database: music_platform
Client: "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -u root -p123456
```

初始化数据库：`mysql -u root -p123456 < backend/src/main/resources/schema.sql`

### 测试

```bash
# 后端 API 测试脚本
bash backend/test.sh

# 或手动 curl
TOK=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser1","password":"Abc123456"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')

# 上传歌曲（字段名必须为 audio，不能是 file）
curl -X POST http://localhost:8080/api/songs/upload -H "Authorization: Bearer $TOK" \
  -F "title=歌名" -F "artist=歌手" -F "style=pop" -F "mood=happy" \
  -F "audio=@path/to/file.mp3"
```

### 常用 API 端点

- `GET /api/songs/{id}/stream` — 音频流（支持 Range）
- `GET /api/songs/{id}/cover` — 封面图
- `GET /api/songs/{id}/video` — MV视频流
- `PUT /api/songs/{id}` — 编辑歌曲（需登录，上传者或管理员）
- `DELETE /api/songs/{id}` — 删除歌曲（需登录，上传者或管理员）
- `POST /api/songs/{id}/video` — 上传MV（MP4，≤200MB）
- `POST /api/songs/upload` — 上传歌曲（需登录），参数含 `isPublic`
- `GET /api/favorites/{songId}/count` — 歌曲收藏数（公开）
- `GET /api/favorites/check/{songId}` — 当前用户是否已收藏
- `POST /api/playlists/{id}/songs` — 添加歌曲到歌单

## 数据库

7 张表：`users` / `admins` / `songs` / `playlists` / `playlist_songs` / `favorites` / `play_history`

`songs` 表额外字段：`video_path`（MV视频路径）、`is_public`（公开/私人，默认1）。

歌曲的 style（8 种）和 mood（6 种）枚举值见 `docs/开发文档.md` §4.2。

## 核心架构要点

### 前端路由与布局

6 个页面（lazy-loaded）：`/` HomePage、`/play/:songId` PlayPage、`/upload` UploadPage、`/profile` ProfilePage、`/login` LoginPage、`/playlist/:id` PlaylistPage（P5R风格）。

`AppLayout` 包裹除登录页外的所有页面，内部用 `AnimatePresence` + `<motion.div key={pathname}>` 包裹 `<Outlet />` 实现页面过渡动画，`<PlayerBar />` 在动画外部保持常驻，不随页面切换卸载/重载。

布局组件（`components/layout/`）：`AppLayout`、`PlayerBar`、`PlayerBarRomantic`、`RadioPanel`、`RightControls`、`TopIcons`、`QueuePanel`。

### 状态管理

5 个 Zustand stores：
- `authStore` — 用户/JWT，含 `user.role`（`"user"` 或 `"admin"`）
- `playerStore` — 播放队列、播放模式、当前时间、音量。音量通过 `localStorage('playerVolume')` 持久化，`setVolume` 同步写入。队列、currentIndex、playMode 通过 `localStorage('playerState')` 持久化（JSON 序列化），刷新页面后精确恢复到正在播放的歌曲。播放进度通过 `localStorage('playerProgress')` 每 2 秒保存（含 songId），`canplay` 事件自动恢复到上次播放位置。
- `useStore` — 首页 UI 状态（场景选择、粒子速度、accentColor）
- `useUploadStore` — 上传表单（含 `videoFile`、`isPublic`）+ 进度
- `useMouseStore` — 登录页 3D 视差

### 播放栏 (PlayerBar)

**当前设计**：左下角嵌入 3/4 黑胶唱片（260px），圆心为旋转封面图，外环为 SVG 圆形进度条（可点击/拖拽跳转）。音量控制独立置于唱片右侧底部。播放控制按钮（切歌、循环模式、收藏）移到了 PlayPage 的 `RadioPanel` 中。

### 音频播放

全局单一 `<audio>` 元素由 `useAudioPlayer` hook 管理（在 `PlayerBar.tsx` 中调用）。`startAudioPlayback(songId)` 在点击事件中直接调用以符合 Chrome 自动播放策略。

**关键**：后端流式端点 `/api/songs/{id}/stream` 必须直接返回文件字节并正确处理 HTTP Range 请求（206 Partial Content + Content-Range header），**绝对不能**返回 302 重定向。

### 上传接口字段名

前端发送 `FormData` 时：
- MP3 文件字段名 `audio`（不是 `file`）
- 封面图字段名 `cover`
- MV视频字段名 `video`
- 可见性字段 `isPublic`（`"true"` / `"false"`，默认公开）

### 播放队列面板 (QueuePanel)

PlayPage 右侧 `RightControls` 中 `📋` 按钮可切换右下角队列面板，显示当前播放队列全部歌曲。当前歌曲高亮（橙色左边框 + ▶ 图标），点击任意歌曲可切歌。按钮在面板打开时变为橙色。

### 沉浸模式

HomePage 右上角「个人中心」按钮下方 `🌙 沉浸模式` 按钮。点击弹出确认弹窗，确认后进入全屏并隐藏所有 UI 元素（仅保留 3D 场景背景），按 ESC 退出。通过 `body.immersive-mode` CSS class + `[data-immersive-hide]` 属性控制隐藏。PlayerBar 的两个 fixed 定位 div 带有 `data-immersive-hide` 属性。

### 3D 场景

react-three-fiber + Three.js。可用场景组件：`SolarSystem`（太阳系·宇宙星河）、`BeachScene`（夏日海滩）、`CityScene`、`RomanticShape`、`ParticleTunnel`、`StarryGalaxy`（已废弃，被 SolarSystem 替代）。`SceneEngine` 根据歌曲 style/mood 自动选择场景（目前未接入 PlayPage）。

**PlayPage 场景选择**：用户可在设置面板手动选择场景。`selectedScene === 'galaxy'` → `<SolarSystem />`，`selectedScene === 'beach'` → `<BeachScene />`，其余 → `<Scene3D />`（城市场景）。

**画面效果按钮**（设置面板中三个开关）：
- **粒子特效**：城市场景 `Particles`+`SnowParticles`，宇宙星河 `GalaxyParticles`，海滩场景自带 `FoamParticles`
- **后处理 Bloom**：城市场景调整雾/灯光色温，海滩场景通过 `ToneMappingSetup` 控制 ACES 曝光
- **暗角遮罩**：CSS vignette 覆盖层，对所有场景通用

**SolarSystem 组件**（`src/components/scenes/SolarSystem.tsx`）：
- `Sun`：双层 GLSL 着色器——表面为 FBM domain-warping 湍流火焰（`SunFireMaterial`），外层为动态脉动日冕（`SunCoronaMaterial`，BackSide + AdditiveBlending）。三层 Sprite 光晕以不同频率呼吸脉动，需配合圆形渐变纹理 `map` 使用（否则变方形）
- `Starfield`：2500 个 BufferGeometry 远景星空粒子
- `Planet`：8 颗行星（水星→海王星），每颗使用 Canvas 程序化生成 diffuse/emissive/bump 三张贴图（512×256），包含大陆、条纹、陨石坑等细节。`Planet` 组件通过 `type` 属性自动匹配纹理
- `OrbitRing`：`drei/Line` 亮蓝半透明轨道环（`#4466aa`，opacity 0.5）
- 相机：PlayPage 中 `GalaxyAutoRotate` 组件实现无规则有机漫游（多层不相称正弦波叠加），始终以太阳系为中心，左上角 📷 按钮可开关
- 照明：仅太阳中心 `pointLight`，无 ambientLight

**BeachScene 组件**（`src/components/scenes/BeachScene.tsx`）：
- 天空：**不能用 BackSide + ShaderMaterial**（Three.js 0.184 + WebGL2 下渲染为黑球）。方案用 Canvas 渐变纹理 → `scene.background`（`EquirectangularReflectionMapping`），色序注意 Canvas 底部=天顶。太阳 Sprite 光晕（AdditiveBlending）
- 海洋：Simplex 3D 噪声波浪（`snoise` GLSL）+ 菲涅尔反射 + Blinn-Phong 512次幂高光 + 波峰泡沫。`ShaderMaterial` + `DoubleSide`，透明度 0.94
- 沙滩：`THREE.Shape()` 贝塞尔曲线 + `quadraticCurveTo` → `ShapeGeometry`，自定义 sand shader（depth-based 干湿渐变，GLSL `random` 噪点模拟沙粒）
- 棕榈树：`CatmullRomCurve3` 弯曲树干 + `TubeGeometry` + 树皮环痕，羽状复叶（18对小叶 per leaf），椰子果实。`useFrame` 风力摇摆 ±0.06rad
- 海鸥/鱼/泡沫/涟漪/水花：参照 HTML 参考源码的动画逻辑
- 色调映射：`ACESFilmicToneMapping` exposure=1.4，`outputColorSpace=SRGBColorSpace`
- 雾效：`FogExp2('#4D9BFF', 0.0008)`
- 光照：主方向光 `#FFFAF0` intensity 3.0 位置 `(100,200,50)` + 冷色补光 `#E6F3FF` 0.8 + 环境光 `#FFFFFF` 0.85 + 半球光

### 氛围背景引擎

纯前端实现。不依赖后端自动分析，用户上传时手动选择 style 和 mood。场景背景 + 粒子动画由 `SceneEngine` 根据标签组合渲染。

## 音频文件存储

上传的 MP3 存储在 `backend/uploads/audio/`（UUID 文件名）。`application.yml` 中 `app.upload.audio-dir` 和 `cover-dir` 配置路径。Spring `WebMvcConfig` 将 `file:uploads/` 映射为 `/uploads/**` 静态资源。

## Bug 修复规则

1. 自行排查并修复代码
2. 修复后自行测试（编译检查 + curl 验证 + 逐页确认）
3. 测试不通过则继续修复，直到通过为止
4. 通过后再通知用户

## GitHub 仓库

远程仓库地址：`https://github.com/Boo513/music_platform`

每次完成代码修改并测试通过后，必须执行 git commit 并 push 到远程仓库。

**注意**：GitHub 默认分支为 `main`，本地工作在 `master`。Push 后需同步两个分支：

```bash
git push origin master
git checkout main && git merge master -m "同步" && git push origin main && git checkout master
```

## 任务完成后的行为

每次完成一个任务后，主动列出接下来可以做的待办事项，供用户选择下一步方向。
