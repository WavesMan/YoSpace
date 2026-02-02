---
title: "YoSpace 使用说明"
description: "一个基于 Next.js App Router 的个人主页项目，包含个人介绍、博客、友链与全站音乐播放器。整体以组件化组织，强调响应式体验与可维护性。"
date: "2026-02-01T14:25:00Z"
tags: ["Next.js", "Markdown"]
isPinned: true
pinnedRank: 02
isRecommended: true
recommendRank: 01
---

# YoSpace

一个基于 Next.js App Router 的个人主页项目，包含个人介绍、博客、友链与全站音乐播放器。整体以组件化组织，强调响应式体验与可维护性。

> 本项目原始灵感与UI/UX设计源于 [KumaKorin/react-homepage](https://github.com/KumaKorin/react-homepage)，佬的个人主页：[KumaKorin](https://korin.im/)

## 功能概览

- 首页：个人简介、社交链接展示
- 博客：文章列表与文章详情，支持 Markdown
- 友链：友链卡片展示
- 音乐播放器：全局悬浮播放器，支持播放列表、拖拽排序、进度/音量拖动、播放模式切换
- 主题切换：亮色/暗色模式
- 国际化：中英文切换（可通过环境变量开关）

## 技术栈

- 框架：Next.js（App Router）
- 语言：TypeScript
- UI：React + CSS Modules
- 动效：framer-motion
- Markdown：gray-matter + react-markdown + remark-gfm + rehype-raw
- 代码高亮：react-syntax-highlighter（含一键复制）
- 拖拽实现：@hello-pangea/dnd  [参考实现：[超详细的实现 React 组件拖拽功能](https://juejin.cn/post/7168506198520987684)]
- 规范：ESLint

## 快速开始

### 本地化

建议使用 pnpm（仓库包含 pnpm-lock.yaml）。

1) 安装依赖

```bash
pnpm install
```

2) 配置环境变量

将 `.env.example` 复制为 `.env` 或 `.env.local`，按需修改。

3) 启动开发

```bash
pnpm dev
```

浏览器访问：`http://localhost:3000`

### 使用 Vercel 部署

点击按钮自动在你的GitHub创建仓库，全程Vercel自动化部署，无需本地操作：
<br>[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WavesMan/YoSpace.git)

## 常用脚本

```bash
# 本地开发
pnpm dev

# 构建
pnpm build

# 本地启动（需先 build）
pnpm start

# 代码检查
pnpm lint
```

## 环境变量配置

项目使用 `NEXT_PUBLIC_*` 形式的变量（会暴露到浏览器端），请避免在这些变量中放入敏感信息。

可以参考 [.env.example](./.env.example)。核心配置如下：

### Server Actions（反向代理 / CDN 场景）

- `SERVER_ACTIONS_ALLOWED_ORIGINS`：允许触发 Server Actions 的来源域名白名单（逗号分隔）。
- 适用场景：站点在 CDN / 反向代理套壳后，出现 `x-forwarded-host` 与 `origin` 不一致，导致 `Invalid Server Actions request`。
- 填写规则：仅填写域名（可包含端口），不要带协议（`https://`）与路径。
- 示例：`yospace.waveyo.cn,yospace-vercel.waveyo.cn`

### Contentful（可选）

仓库保留了 Contentful 的变量字段，但当前博客实现默认使用本地 Markdown 文件作为内容源。

- `NEXT_PUBLIC_CONTENTFUL_SPACE_ID`
- `NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN`
- `NEXT_PUBLIC_CONTENTFUL_BLOG_MODEL`
- `NEXT_PUBLIC_CONTENTFUL_BLOG_ORDER_TYPE`

### 博客

- `NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE`：分页每页数量
- `NEXT_PUBLIC_BLOG_MODE`：`internal`（站内路由）或 `external`（跳转外部博客）
- `NEXT_PUBLIC_BLOG_URL`：外部博客地址（仅 `external` 模式生效）

### 国际化

- `NEXT_PUBLIC_I18N`：是否启用语言切换（`true/false`）

### 站点信息

- `NEXT_PUBLIC_SITE_TITLE` / `NEXT_PUBLIC_SITE_TITLE_EN`
- `NEXT_PUBLIC_NAV_TITLE` / `NEXT_PUBLIC_NAV_TITLE_EN`
- `NEXT_PUBLIC_SITE_DESCRIPTION` / `NEXT_PUBLIC_SITE_DESCRIPTION_EN`
- `NEXT_PUBLIC_PROFILE_NAMES` / `NEXT_PUBLIC_PROFILE_NAMES_EN`：多个名称用逗号分隔
- `NEXT_PUBLIC_PROFILE_IMAGE`
- `NEXT_PUBLIC_FAVICON_URL`

### 备案信息（可选）

- `NEXT_PUBLIC_ICP_CODE`
- `NEXT_PUBLIC_POLICE_LICENSE`

### 音乐播放器

- `NEXT_PUBLIC_MUSIC_API_BASE`：音乐 API 基地址
- `NEXT_PUBLIC_MUSIC_PLAYLIST_ID`：播放列表 ID

默认情况下，项目在 [next.config.ts](./next.config.ts) 中配置了音乐 API 的反向代理：

- 本地访问：`/api/music-proxy/*`
- 转发到：`https://netmusic.waveyo.cn/*`

如果 `NEXT_PUBLIC_MUSIC_API_BASE` 配置为 `https://netmusic.waveyo.cn/`，播放器会优先走站内代理路径，减少跨域问题。

> `netmusic.waveyo.cn` 所提供的API支持是免费的，但是运行维护是需要消耗资源的，如果您使用此API，希望能够前往 [dq.waveyo.cn](https://dq.waveyo.cn) 提供一些支持，并且备注信息赞助Music API，以支撑API运营。

### 友链管理

访问文件 `src\data\friendLinks.json` 修改 `json` 内容控制

json格式形如：( `subtitle` 可留空)

```json
[
    {
        "title": "WaveYo",
        "subtitle": "WaveYo HomePage",
        "link": "https://home.waveyo.cn",
        "avatar": "https://cloud.waveyo.cn//Services/websites/home/images/icon/favicon.ico"
    },
    {
        "title": "KumaKorin",
        "link": "https://korin.im",
        "avatar": "https://m1.miaomc.cn/uploads/20210623_b735dde7c665d.jpeg"
    },
]
```

### 个人社交链接管理

访问文件 `src\data\socialLinks.json` 修改 `json` 内容控制

json格式形如：

```json
[
  {
    "name": "bilibili",
    "url": "https://space.bilibili.com/204818057",
    "iconPackage": "fa6",
    "iconName": "FaBilibili"
  },
  {
    "name": "email",
    "url": "mailto:support@email.example",
    "iconPackage": "md",
    "iconName": "MdEmail"
  },
  {
    "name": "github",
    "url": "https://github.com",
    "iconPackage": "fa6",
    "iconName": "FaGithub"
  }
]
```

`iconName` `iconPackage` 参阅 [GitHub Repo | React Icons](https://github.com/react-icons/react-icons) 与 [React Icons](https://react-icons.github.io/react-icons/) 说明

## 内容管理（本地 Markdown）

本地文章位于：`src/content/posts/`

- 英文：`slug.md`
- 中文：`slug.zh-CN.md`

文章使用 Front Matter 描述基础信息，示例：

```md
---
title: "欢迎来到我的博客"
description: "这是一篇使用 Markdown 文件的示例文章。"
date: "2026-01-20T10:00:00Z"
tags: ["Next.js", "Markdown"]
---

正文内容...
```

## 目录结构

```text
src/
  app/                Next.js 路由与布局（App Router）
  actions/            Server Actions（如博客内容读取）
  components/         业务组件
    Blog/             博客相关组件
    Links/            友链相关组件
    MusicPlayer/      音乐播放器（Hooks + 子组件）
    Common/           通用组件（Header/Footer/ProgressBar 等）
  content/posts/      本地 Markdown 文章
  context/            全局上下文（国际化）
  data/               静态数据（社交链接、友链）
  locales/            语言包
  utils/              工具与内容读取逻辑
public/               静态资源
```

## 部署建议

- 适合部署到 Vercel、Netlify 或自建 Node 服务。
- 部署前确保配置好环境变量（尤其是站点信息与音乐 API）。
- 构建命令：`pnpm build`，启动命令：`pnpm start`。

### 部署你自己的Music API？

本项目源码使用的Music API为 [API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)，你可以按照此仓库提供的Docs描述自行部署API。

## 常见问题

### 音乐无法播放 / 歌单加载失败

- 检查 `NEXT_PUBLIC_MUSIC_API_BASE` 与 `NEXT_PUBLIC_MUSIC_PLAYLIST_ID` 是否正确。
- `netmusic.waveyo.cn` 所提供的API支持是免费的，但是运行维护是需要消耗资源的，如果您使用此API，希望能够前往 [dq.waveyo.cn](https://dq.waveyo.cn) 提供一些支持，并且备注信息赞助Music API，以支撑API运营。

### 文章列表为空

- 确认 `src/content/posts/` 下存在对应语言的文章文件。
- 中文文件名需为 `*.zh-CN.md`，英文为 `*.md`。
