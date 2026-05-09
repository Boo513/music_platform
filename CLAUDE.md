# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

在线音乐播放 Web 平台。用户上传 MP3 音乐并标注风格/情绪标签，播放时根据标签动态渲染沉浸式场景背景（赛博朋克城市、宇宙星河、山水森林等），配合粒子特效营造氛围感。

完整设计文档：`docs/specs/2026-05-08-在线音乐播放平台-设计文档.md`

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React + TypeScript（SPA） |
| 后端 | Java Spring Boot（REST API） |
| 数据库 | MySQL |
| 认证 | JWT（BCrypt 密码加密） |
| 音频 | MP3 only，支持 Range 请求断点续传 |

## 架构

三层架构：React SPA → Spring Boot REST API → MySQL + 文件系统

- 氛围背景引擎为纯前端实现（CSS 场景 + 粒子动画），不依赖后端
- 音乐风格/情绪由用户上传时手动选择（预设枚举值），非自动分析
- 8 种风格 × 6 种情绪 = 48 种场景组合

## 核心数据模型

5 张表：`users` / `songs`（含 style 和 mood 标签字段）/ `playlists` + `playlist_songs` / `play_history` / `favorites`

歌曲的 style（8 种：摇滚/流行/古典/电子/民谣/爵士/嘻哈/R&B）和 mood（6 种：开心/悲伤/平静/激昂/浪漫/忧郁）是氛围背景引擎的输入参数。

## 播放器 UI 布局

- 90% 画面留给场景背景 + 浮动粒子
- 左下角：220px 半圆唱片嵌入角落（环形进度弧线）
- 半圆上方：播放▶ + 收藏♡ + 添加到歌单+（38-46px 按钮）
- 半圆右侧：上一首⏮ + 下一首⏭ + 随机🔀（统一 38px）
- 左上角：大号音量图标 + 120px 进度条
- 底部：进度条贴底边全宽，霓虹渐变色

## Bug 修复规则

当用户报告 Bug 时：
1. 自行排查并修复代码
2. 修复后自行测试（编译检查 + 浏览器验证 + 逐页确认）
3. 测试不通过则继续修复，直到通过为止
4. 通过后再通知用户

## 目录结构（规划）

```
frontend/      # React + TypeScript
backend/       # Spring Boot
docs/specs/    # 设计文档
uploads/       # MP3 文件存储
```
