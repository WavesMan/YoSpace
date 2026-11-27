# 正式站 SEO 与 GEO

正式域名配置在 `src/data/seo.json`。Next.js 页面 canonical、robots、Sitemap、RSS、Atom 及搜索引擎提交脚本使用 `https://yospace.waveyo.cn`。`redirectHosts` 仅填写由本部署负责的别名。列出的别名保留路径和查询参数，返回 `308` 到站点域名。

## 内容发布

- 正式博客列表和 Sitemap 读取 `*.zh-CN.md`。文章路径保持稳定。
- 文章使用真实的 `date`，实质修订才增加或更新 `updatedAt`。中文旧文中未标时区的时分按北京时间解释。
- `author` 可覆盖默认站点作者。可选 `image` 填适合代表文章内容的可公开抓取图片 URL 或站内路径。
- 文章优先在开头回答读者的问题，写明适用版本、验证方法与结果。架构文章可以链接到相关实现和复盘。
- 分类、归档、主要列表均可抓取。标签至少关联两篇文章才进入 Sitemap，单篇标签页和站内搜索通过 `noindex` 保留给用户浏览。
- 有正式英文译文时再为译文增加稳定的语言路径和双向 `hreflang`。

## 发布验证

1. 检查 `/robots.txt`、`/sitemap.xml`、RSS 和 Atom 中的正式域名，核对文章更新时间与页面正文。确认无效文章、分类、标签及分页返回 `404`。
2. 在关闭 JavaScript 的浏览器打开 `/blog?page=2`，检查页面有独立标题和第二页文章，分页能点击。
3. 在 Google Search Console、Bing Webmaster Tools 和百度搜索资源平台验证正式域名。使用 HTML 标签验证时，分别配置 `GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION` 与 `BAIDU_SITE_VERIFICATION`。提交 `https://yospace.waveyo.cn/sitemap.xml`，抽查文章及专题页。
4. 用 28 天为周期观察 Google 非品牌搜索与生成式 AI 展示、Bing 搜索及 AI Performance 引用、百度索引量与关键词表现。百度站点已开放 AI 流量分析时，也可查看相关数据。

## 主动提交变更

正式部署成功后再运行。IndexNow 提交新增、实质修改和删除的 URL。先在正式域名根目录发布与 `INDEXNOW_KEY` 同名的 `.txt` 文件，文件内容为该密钥。百度普通收录提交新增或实质更新的可访问 URL，令牌由对应站点的后台提供。

```powershell
node scripts/submit-search-urls.mjs indexnow /blog/文章路径
node scripts/submit-search-urls.mjs baidu /blog/文章路径
```

脚本从运行环境读取 `INDEXNOW_KEY` 或 `BAIDU_PUSH_TOKEN`。提交回执表示平台接收到 URL，后续抓取、收录和展示由平台决定。
