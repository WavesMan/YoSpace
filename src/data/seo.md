# SEO 配置说明

本文件用于说明 seo.json 的字段含义与使用范围，便于统一管理站点 SEO 配置。

## 字段说明

### siteUrl
站点主域名，用于生成 canonical、open graph 与 sitemap 相关链接。

### siteName
站点名称，用于社交分享与页面标题拼接。

### defaultTitle
默认页面标题，用于未提供页面级标题时的兜底。

### defaultDescription
默认页面描述，用于未提供页面级描述时的兜底。

### defaultOgImage
默认分享图路径，建议指向 public 内的静态资源相对路径。

### twitterHandle
作者账号，用于 Twitter 分享卡片的 creator 字段。

### twitterSite
站点账号，用于 Twitter 分享卡片的 site 字段。

### sitemap
站点地图配置，影响全站默认的变更频率与权重。

#### sitemap.changeFrequency
默认更新频率，适用于大部分页面。

#### sitemap.priority
默认优先级，适用于大部分页面。

## 示例

```json
{
  "siteUrl": "https://your-domain.com",
  "siteName": "YoSpace",
  "defaultTitle": "YoSpace",
  "defaultDescription": "从群众出发，扎根群众。向前，无限进步",
  "defaultOgImage": "/og-default.png",
  "twitterHandle": "@your_handle",
  "twitterSite": "@your_site",
  "sitemap": {
    "changeFrequency": "weekly",
    "priority": 0.7
  }
}
```

### 使用建议

- siteUrl 使用线上域名，避免使用 localhost
- defaultOgImage 指向 public 下的静态文件相对路径
- twitterHandle 与 twitterSite 可按需留空
