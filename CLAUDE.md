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
```

Vite 代理配置：`/api` 和 `/uploads` 代理到 `localhost:8080`。

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
# 后端 API 测试（curl）
TOK=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser1","password":"Abc123456"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')

# 上传歌曲（字段名必须为 audio，不能是 file）
curl -X POST http://localhost:8080/api/songs/upload -H "Authorization: Bearer $TOK" \
  -F "title=歌名" -F "artist=歌手" -F "style=pop" -F "mood=happy" \
  -F "audio=@path/to/file.mp3"
```

## 数据库

6 张表：`users` / `songs` / `playlists` / `playlist_songs` / `favorites` / `play_history`

歌曲的 style（8 种）和 mood（6 种）枚举值见 `docs/开发文档.md` §4.2。

## 核心架构要点

### 前端路由与布局

5 个页面（lazy-loaded）：`/` HomePage、`/play/:songId` PlayPage、`/upload` UploadPage、`/profile` ProfilePage、`/login` LoginPage。另有 `/playlist/:id` PlaylistPage。

`AppLayout` 包裹除登录页外的所有页面，渲染 `<Outlet />` + 全局 `<PlayerBar />`。PlayPage 用 `paddingBottom: 72` 避免被 PlayerBar 遮挡。

### 状态管理

5 个 Zustand stores：
- `authStore` — 用户/JWT
- `playerStore` — 播放队列、播放模式、当前时间、音量
- `useStore` — 首页 UI 状态（场景选择、粒子速度）
- `useUploadStore` — 上传表单 + 进度
- `useMouseStore` — 登录页 3D 视差

### 音频播放

全局单一 `<audio>` 元素由 `useAudioPlayer` hook 管理（在 `PlayerBar.tsx` 中调用）。使用浏览器原生 `HTMLAudioElement`，**不是** Web Audio API。

**关键**：后端流式端点 `/api/songs/{id}/stream` 必须直接返回文件字节并正确处理 HTTP Range 请求（206 Partial Content + Content-Range header），**绝对不能**返回 302 重定向 — 浏览器 `<audio>` 元素不会在重定向时携带 Range 头，会导致每次请求全文件、解码异常、播放听起来像慢速。

### 上传接口字段名

前端发送 `FormData` 时 MP3 文件字段名为 `audio`（不是 `file`），与后端 `@RequestParam("audio")` 对应。

### 3D 场景

react-three-fiber + Three.js。可用场景组件：`CityScene`、`StarryGalaxy`、`RomanticShape`、`ParticleTunnel`。`SceneEngine` 根据歌曲 style/mood 选择场景。PlayPage 有独立的内联 3D 场景（城市 + 灯塔 + 粒子 + 雪花）。

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

## 任务完成后的行为

每次完成一个任务后，主动列出接下来可以做的待办事项，供用户选择下一步方向。
