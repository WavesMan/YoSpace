---
title: "博客内容模型与前端功能使用指南"
description: "介绍博客文章 frontmatter 各字段含义，以及置顶、推荐、分类、标签、系列等功能的使用方式。"
date: "2026-02-03T12:00:00Z"
category:
  id: "blog-config"
  labelEn: "Blog Config"
  labelZh: "博客配置"
  colorToken: "purple"
tags: ["Frontmatter", "置顶文章", "推荐文章", "分类", "标签", "系列"]
series:
  id: "usage-series"
  index: 2
  label: "使用说明"
isPinned: true
pinnedRank: 4
isRecommended: true
recommendRank: 01
---

# 博客内容模型与前端功能使用指南

这篇文章想做一件很简单的事：

> 如果你只想“先写文章，再慢慢折腾配置”，那看完这一篇，就能把分类、标签、系列、置顶、推荐这些能力都用起来，而不用去翻代码。

下面会用 `welcome` 这篇示例文章做对照，一块一块讲清楚每个字段是干嘛用的，以及它会在页面上长成什么样子。

## 先把基础信息写全

最基础的三件事：标题、简介、时间。

```yaml
title: "欢迎来到我的博客"
description: "这是一篇使用 Markdown 文件的示例文章。"
date: "2026-01-20T10:00:00Z"
```

简单理解：

- `title`：列表里的大标题、详情页顶部标题；
- `description`：列表里的那两三行摘要，也可以当成 SEO 的描述文案；
- `date`：文章发布时间，用来做时间排序；
  - 建议直接用类似上面这种 ISO 时间字符串，省心也规范。

如果你暂时懒得想描述，`description` 可以先不写，系统会兜底处理，只是列表看起来没那么“有诚意”。

## 分类（category）：帮读者快速知道这篇在说什么

分类是一个小对象，看起来像这样：

```yaml
category:
  id: "status-page"
  labelEn: "Status Page"
  labelZh: "状态页"
  colorToken: "blue"
```

可以简单理解成：

- `id`：给机器看的“代号”，建议用短横线风格，比如 `status-page`、`blog-config`；
- `labelZh` / `labelEn`：给人看的名字，中文/英文环境下各用哪个；
- `colorToken`：可选的颜色关键字，用来稍微“指定一下”这个分类大概是什么颜色，如果不写，就按 `id` 做哈希自动分配。

页面上的效果是：

- 在列表页，分类会出现在卡片左上角，一个彩色的小块，让人一眼看出“这属于哪一类”；
- 在详情页，标题下面也会显示同样的分类，保持一致的颜色和文案。

## 标签（tags）：给文章贴几个“关键词”

标签就是一个字符串数组，例如 `welcome` 里的配置：

```yaml
tags: ["Cloudflare", "宕机", "Rust", "数据库", "502 Bad Gateway"]
```

可以这么用：

- 想象你在给文章贴“搜索关键词”，方便以后按标签回顾；
- 每一个标签都会变成一个小卡片，出现在：
  - 列表卡片上，标题下面；
  - 文章详情页正文上方。

颜色是怎么来的？

- 不需要你手动挑颜色，系统会根据标签文本做哈希，同样的词在全站都保持同一种颜色；
- 对中英文混合项目，一个实用的小建议是：
  - 中文文章写 `"数据库"`；
  - 英文文章里用 `"Database"`；
  - 英文技术名词比如 `"Rust"` 可以直接共用。

## 系列（series）：把一串文章串起来

有时候一篇文章写不完一件事，就可以考虑开一个“系列”，配置大概长这样：

```yaml
series:
  id: "demo-series"
  index: 1
  label: "体验系列"
```

可以这么理解：

- `id`：系列的“家族名”，相同 `id` 的文章会被自动归在一起；
- `index`：这一篇在整个系列里的位置，从 1 开始、2、3 往后排都行；
- `label`：系列的展示名称，比如“体验系列”“重构日记”。

读者看到的：

- 在详情页的底部，会出现一个“系列文章”的小模块；
- 当前这篇会在列表中高亮，读者可以按顺序顺着看过去；
- 排序完全跟 `index` 走，数值越小越靠前。

## 置顶（isPinned / pinnedRank）：放到页面最显眼的位置

有些文章希望常驻首页顶端，那就用上这两个字段：

```yaml
isPinned: true
pinnedRank: 10
```

规则很简单：

- `isPinned` 为 `true` 的文章，会被放进“置顶文章”区域；
- `pinnedRank` 越小，越靠前显示；
- 非置顶文章走正常列表逻辑，不受影响。

比较实用的一个习惯是：

- 用 `0、10、20...` 这种间隔来排，把最重要的设置成 `0`，其次 `10`、`20`；
- 以后如果想往中间插一个优先级更高的，就填 `5` 或 `15` 即可，不用大规模改数字。

当站内没有任何一篇文章设置 `isPinned: true` 时，置顶区域会自动隐藏，不会留下一个空壳在那儿碍眼。

## 推荐（isRecommended / recommendRank）：给“值得一看”的多一点权重

推荐是另一套独立的权重系统，不和置顶抢位置：

```yaml
isRecommended: true
recommendRank: 20
```

- `isRecommended`：你觉得这篇“值得特别推荐”的时候就设为 `true`；
- `recommendRank`：在推荐模式下的排序权重，数字越小越靠前。

它主要影响两个地方：

1. 列表页的排序模式：
   - 当选择“推荐优先”时，会先把 `isRecommended: true` 的文章按 `recommendRank` 排出来；
   - 推荐文章排完之后，再按时间倒序补上其他文章。
2. 详情页底部的“推荐文章”：
   - 会在同语言下挑其他推荐文章出来展示；
   - 当前这篇不会出现在自己的推荐列表中。

同样推荐用 `0、10、20...` 这种间隔，方便你调顺序，避免以后全站大扫除。

## 配置里的“遥控器”：环境变量

除了文章自己的 frontmatter，还有一层是全局的环境变量，用来开关一些功能，主要在 `.env` 里配置。

和博客相关的几个关键变量：

- `NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE`：列表每页显示多少条；
- `NEXT_PUBLIC_BLOG_CATEGORY_ENABLED`：要不要显示分类标签；
- `NEXT_PUBLIC_BLOG_TAGS_ENABLED`：要不要显示标签；
- `NEXT_PUBLIC_BLOG_SERIES_ENABLED`：要不要显示系列模块；
- `NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED`：要不要显示推荐模块；
- `NEXT_PUBLIC_BLOG_MODE`：博客是走站内路由还是跳转外部链接；
- `NEXT_PUBLIC_BLOG_URL`：如果是外部模式，这里填外部博客的地址。

和多语言、站点信息相关的：

- `NEXT_PUBLIC_I18N`：是否开启语言切换；
- `NEXT_PUBLIC_SITE_TITLE` / `NEXT_PUBLIC_SITE_TITLE_EN`：中英文站点标题；
- 还有导航标题、副标题、个人简介等，都有对应的中英文版本可以配。

## 把它们串在一起：完整示例

最后再回到 `welcome.zh-CN.md`，看一眼一个“写得比较完整”的 frontmatter 是什么样子：

```yaml
title: "欢迎来到我的博客"
description: "这是一篇使用 Markdown 文件的示例文章。"
date: "2026-01-20T10:00:00Z"
category:
  id: "status-page"
  labelEn: "Status Page"
  labelZh: "状态页"
  colorToken: "blue"
tags: ["Cloudflare", "宕机", "Rust", "数据库", "502 Bad Gateway"]
series:
  id: "demo-series"
  index: 1
  label: "体验系列"
isPinned: true
pinnedRank: 0
isRecommended: true
recommendRank: 10
```

你可以直接把这一段复制走，改几个字段：

- 换一个自己的 `category.id` 和名称；
- 把标签替换成这篇文章真正关心的关键词；
- 视情况决定要不要置顶、要不要推荐；
- 如果是个系列，就给它一个共同的 `series.id` 和不同的 `index`。

调几次之后，你就会发现：

> “写文章”这件事，其实就是顺手多写几行 frontmatter，剩下的交给前端就好了。
