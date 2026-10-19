# 友链图标构建缓存

原先友链卡片直接通过 `next/image` 的 `unoptimized` 模式读取 `avatar` 外链，访客浏览器仍须访问对方图片服务器，受网络、跨站策略、防盗链及 CDN 可用性影响。

现在 `pnpm build` 先执行 `scripts/cache-friend-favicons.mjs`，再编译 Next.js。源配置仍为 `src/data/friendLinks.json`，脚本不会修改它。

## 获取和展示流程

1. `avatar` 为站内绝对路径时，检查对应 `public` 文件是否存在。
2. 远程 `avatar` 优先下载；未填写或下载失败时，读取友链页面的 `icon`、`shortcut icon` 或 `apple-touch-icon`，最后尝试站点根目录 `/favicon.ico`。
3. 图标按内容 SHA-256 前 24 位命名，保存到 `public/friend-favicons/`，同一下载源只处理一次。支持 PNG、JPEG、GIF、WebP、ICO、AVIF 的文件头校验，不依据 URL 后缀或服务器 MIME 判断。
4. `src/data/friendFavicons.json` 保存源地址到站内路径的映射。页面通过映射加载本地文件，浏览器图片加载错误时同样回退到本地 `default.svg`，不再尝试外链。

远程 SVG 暂不直接保存，避免携带脚本或其他外部资源；脚本继续尝试其他候选。校验为文件头与大小检查，并非完整图像解码，无法解码的文件由页面本地默认图标兜底。

## 缓存、超时和交付

- 缓存七天有效，有效缓存不联网；过期或 `--refresh` 时重新下载。
- 每个友链的所有请求共用 12 秒超时，最多四个友链并发；每个响应上限 2 MiB，站点图标候选最多五个。
- 单站下载失败会告警，保留可用旧缓存；没有缓存则使用默认图标，构建继续。配置 JSON 损坏或磁盘写入失败会让构建失败，避免发布不完整映射。
- 映射采用临时文件后重命名写入，图标以内容寻址；旧资源保留，避免已打开页面的资源突然失效。
- 生成的映射与图片作为代码资源一起提交，可让干净检出或离线构建复用。部署需包含 `public/friend-favicons/`（与其他 Next.js 静态资源相同）。

```bash
# 开发前准备图标，构建时会自动执行
pnpm cache-friend-favicons
# 强制刷新（npm 使用 npm run cache-friend-favicons -- --refresh）
pnpm cache-friend-favicons --refresh
# 回归：去重、缓存、断网、格式、大小、站点发现、本地资源与总超时
pnpm test:friend-favicons
```

本模块只处理友链头像，不更改首页导航图标、文章图片或本站 favicon。首次离线构建且没有可用缓存时仍能展示默认图标，但无法获取真实远程图标。
