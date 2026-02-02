---
title: "YoSpace Usage Guide"
description: "A personal homepage built with Next.js App Router, featuring profile, blog, links, and a global music player. Designed with modular components for responsive, maintainable UI."
date: "2026-02-01T14:25:00Z"
tags: ["Next.js", "Markdown"]
isPinned: true
pinnedRank: 02
isRecommended: true
recommendRank: 01
---

# YoSpace

A personal homepage project built with Next.js App Router. It includes a profile page, blog, links page, and a site-wide music player. The codebase is organized in a modular, component-driven way to keep the UI responsive and maintainable.

> The original inspiration and UI/UX direction come from [KumaKorin/react-homepage](https://github.com/KumaKorin/react-homepage). Author’s homepage: [KumaKorin](https://korin.im/)

## Feature Overview

- Home: profile and social links
- Blog: post list and post detail, with Markdown support
- Links: link cards
- Music Player: global floating player with playlist, drag-and-drop reorder, progress/volume dragging, and play mode switching
- Theme: light/dark mode
- i18n: Chinese/English switch (controlled by env var)

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- UI: React + CSS Modules
- Animation: framer-motion
- Markdown: gray-matter + react-markdown + remark-gfm + rehype-raw
- Syntax highlighting: react-syntax-highlighter (with one-click copy)
- Drag & drop: @hello-pangea/dnd (reference: [A very detailed guide to React drag-and-drop components](https://juejin.cn/post/7168506198520987684))
- Linting: ESLint

## Quick Start

### Local development

pnpm is recommended (this repo includes pnpm-lock.yaml).

1) Install dependencies

```bash
pnpm install
```

2) Configure environment variables

Copy `.env.example` to `.env` or `.env.local`, then adjust values as needed.

3) Start development server

```bash
pnpm dev
```

Open: `http://localhost:3000`

### Deploy on Vercel

#### One-click repo creation
Click the button to create a repo in your GitHub automatically. Vercel will handle the deployment end-to-end without local setup:
<br>[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WavesMan/YoSpace.git)

## Common Scripts

```bash
# Local development
pnpm dev

# Build
pnpm build

# Start locally (run build first)
pnpm start

# Lint
pnpm lint
```

## Environment Variables

This project uses `NEXT_PUBLIC_*` variables (exposed to the browser). Do not put secrets in these variables.

See [.env.example](./.env.example) for a full list. Key options:

### Server Actions (Proxy / CDN)

- `SERVER_ACTIONS_ALLOWED_ORIGINS`: Comma-separated allowlist of origin domains that can trigger Server Actions.
- When to use: If you put the site behind a CDN/reverse proxy and see errors like `Invalid Server Actions request` caused by `x-forwarded-host` not matching `origin`.
- Format: Domains only (may include port). Do not include protocol (`https://`) or paths.
- Example: `yospace.waveyo.cn,yospace-vercel.waveyo.cn`

### Contentful (optional)

The repo keeps Contentful-related variables, but the current blog implementation uses local Markdown files by default.

- `NEXT_PUBLIC_CONTENTFUL_SPACE_ID`
- `NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN`
- `NEXT_PUBLIC_CONTENTFUL_BLOG_MODEL`
- `NEXT_PUBLIC_CONTENTFUL_BLOG_ORDER_TYPE`

### Blog

- `NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE`: items per page
- `NEXT_PUBLIC_BLOG_MODE`: `internal` (in-app route) or `external` (redirect to an external blog)
- `NEXT_PUBLIC_BLOG_URL`: external blog URL (only used when mode is `external`)

### i18n

- `NEXT_PUBLIC_I18N`: enable language switch (`true/false`)

### Site Info

- `NEXT_PUBLIC_SITE_TITLE` / `NEXT_PUBLIC_SITE_TITLE_EN`
- `NEXT_PUBLIC_NAV_TITLE` / `NEXT_PUBLIC_NAV_TITLE_EN`
- `NEXT_PUBLIC_SITE_DESCRIPTION` / `NEXT_PUBLIC_SITE_DESCRIPTION_EN`
- `NEXT_PUBLIC_PROFILE_NAMES` / `NEXT_PUBLIC_PROFILE_NAMES_EN`: multiple names separated by commas
- `NEXT_PUBLIC_PROFILE_IMAGE`
- `NEXT_PUBLIC_FAVICON_URL`

### ICP/Regulatory Info (optional)

- `NEXT_PUBLIC_ICP_CODE`
- `NEXT_PUBLIC_POLICE_LICENSE`

### Music Player

- `NEXT_PUBLIC_MUSIC_API_BASE`: music API base URL
- `NEXT_PUBLIC_MUSIC_PLAYLIST_ID`: playlist ID

By default, [next.config.ts](./next.config.ts) contains a rewrite proxy for the music API:

- Local path: `/api/music-proxy/*`
- Proxied to: `https://netmusic.waveyo.cn/*`

If `NEXT_PUBLIC_MUSIC_API_BASE` is set to `https://netmusic.waveyo.cn/`, the player will prefer the in-app proxy path to reduce CORS issues.

> The API provided by `netmusic.waveyo.cn` is free to use, but it costs resources to operate and maintain. If you use this API, consider supporting it at [dq.waveyo.cn](https://dq.waveyo.cn) and note that the donation is for the Music API.

### Friend Links

Edit `src\data\friendLinks.json` to manage your friend links.

JSON format example (`subtitle` is optional):

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

### Social Links

Edit `src\data\socialLinks.json` to manage your social links.

JSON format example:

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

For `iconName` and `iconPackage`, see [React Icons (GitHub)](https://github.com/react-icons/react-icons) and the [React Icons docs](https://react-icons.github.io/react-icons/).

## Content Management (Local Markdown)

Local posts live in: `src/content/posts/`

- English: `slug.md`
- Chinese: `slug.zh-CN.md`

Posts use Front Matter for metadata. Example:

```md
---
title: "Welcome to My Blog"
description: "This is a sample post using a local Markdown file."
date: "2026-01-20T10:00:00Z"
tags: ["Next.js", "Markdown"]
---

Post content...
```

## Directory Structure

```text
src/
  app/                Next.js routes and layout (App Router)
  actions/            Server Actions (e.g. blog content reading)
  components/         Feature components
    Blog/             Blog components
    Links/            Links components
    MusicPlayer/      Music player (Hooks + sub-components)
    Common/           Shared UI (Header/Footer/ProgressBar, etc.)
  content/posts/      Local Markdown posts
  context/            Global context (i18n)
  data/               Static data (social links, friend links)
  locales/            Translation dictionaries
  utils/              Utilities and content loading logic
public/               Static assets
```

## Deployment Notes

- Suitable for Vercel, Netlify, or a self-hosted Node service.
- Configure environment variables before deploying (especially site config and music API).
- Build with `pnpm build`, start with `pnpm start`.

### Deploy your own Music API?

This project’s music API is based on [API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced). You can deploy your own instance by following that repository’s documentation.

## FAQ

### Music won't play / playlist failed to load

- Check whether `NEXT_PUBLIC_MUSIC_API_BASE` and `NEXT_PUBLIC_MUSIC_PLAYLIST_ID` are correct.
- The API provided by `netmusic.waveyo.cn` is free to use but requires ongoing maintenance. If you rely on it, consider supporting it at [dq.waveyo.cn](https://dq.waveyo.cn) and note that the donation is for the Music API.

### Post list is empty

- Make sure there are post files under `src/content/posts/` for your language.
- Chinese posts should be named `*.zh-CN.md`, and English posts should be `*.md`.
