---
title: "Blog Content Model & Frontend Features Guide"
description: "A practical guide to frontmatter fields and how pin, recommend, category, tags and series work in the blog UI."
date: "2026-02-03T12:00:00Z"
category:
  id: "blog-config"
  labelEn: "Blog Config"
  labelZh: "博客配置"
  colorToken: "purple"
tags: ["Frontmatter", "Pinned", "Recommended", "Category", "Tags", "Series"]
series:
  id: "usage-series"
  index: 1
  label: "Usage Guide"
isPinned: true
pinnedRank: 3
isRecommended: true
recommendRank: 1
---

# Blog Content Model & Frontend Features Guide

This article has a very simple goal:

> If you just want to "write posts first and tune configs later", reading this once should be enough to start using categories, tags, series, pin and recommend without touching the code.

We will walk through the `welcome` example post and explain, piece by piece, what each field does and how it shows up in the UI.

## Start with the basics

Three things you almost always want to fill in: title, description and date.

```yaml
title: "Welcome to my blog"
description: "This is an example post written in Markdown."
date: "2026-01-20T10:00:00Z"
```

In short:

- `title`: the big title in the list card and on the detail page;
- `description`: the two or three lines of summary under the title, also useful as SEO description;
- `date`: publish time, used to sort posts by time;
  - using an ISO timestamp like above is the easiest and most robust option.

If you do not feel like writing a description for now, you can leave `description` empty. The system will fall back gracefully, though the list will look a bit less polished.

## Category: tell readers what this post is about

Category is a small object, for example:

```yaml
category:
  id: "status-page"
  labelEn: "Status Page"
  labelZh: "状态页"
  colorToken: "blue"
```

You can think of it like this:

- `id`: the internal identifier for code and styling, recommended to use kebab-case like `status-page` or `blog-config`;
- `labelEn` / `labelZh`: human readable name in English / Chinese;
- `colorToken`: optional color hint, used to gently steer the color of the badge; if omitted, a color will be picked based on `id`.

In the UI:

- on the list page, the category appears as a colored badge in the top-left corner of each card;
- on the detail page, the same badge is shown under the title, with consistent text and color.

## Tags: attach a couple of "keywords" to the post

Tags are just a string array. In the `welcome` example:

```yaml
tags: ["Cloudflare", "Downtime", "Rust", "Database", "502 Bad Gateway"]
```

How to use them:

- imagine you are adding search keywords to the post so you can find it later by topic;
- each tag becomes a small pill-like badge, rendered in two places:
  - on the list card, below the title;
  - on the detail page, above the main content.

About colors:

- you do not have to pick them manually; the system generates colors by hashing the tag text, so the same tag always has the same color across the site;
- for mixed Chinese / English projects, a practical tip is:
  - Chinese posts use `"数据库"`;
  - English posts use `"Database"`;
  - technical names like `"Rust"` can be shared.

## Series: connect a group of related posts

Sometimes one post is not enough to cover a topic. Then it makes sense to create a series, using a config like:

```yaml
series:
  id: "demo-series"
  index: 1
  label: "Demo Series"
```

Interpretation:

- `id`: the family name of the series; posts with the same `id` will be grouped together automatically;
- `index`: the position of this post in the series, usually starting from 1, then 2, 3 and so on;
- `label`: the series title shown to readers, such as "Demo Series" or "Refactor Diary".

What readers will see:

- at the bottom of the detail page there will be a "Series" block if there are multiple posts in the same series;
- the current post is highlighted in that list;
- the order in the list follows `index`: smaller numbers appear first.

## Pin (isPinned / pinnedRank): keep important posts at the top

For posts that should always live at the top of the blog, use these two fields:

```yaml
isPinned: true
pinnedRank: 10
```

The rules are straightforward:

- posts with `isPinned: true` go into the "Pinned" section on the list page;
- among pinned posts, smaller `pinnedRank` means higher priority and earlier position;
- non-pinned posts follow the normal list order and are not affected.

A practical habit is:

- use `0, 10, 20...` as gaps, put the most important post at `0`, then `10`, `20` and so on;
- later, if you want to squeeze in a new post between two existing ones, setting `5` or `15` is enough, no mass renumbering required.

When there is no post with `isPinned: true`, the pinned section will automatically disappear, so the page does not show an empty block.

## Recommend (isRecommended / recommendRank): give extra weight to good reads

Recommendation is a separate layer of priority, independent from pinning:

```yaml
isRecommended: true
recommendRank: 20
```

- `isRecommended`: set it to `true` when you feel this post is especially worth highlighting;
- `recommendRank`: weight used when the list is in "recommend first" mode; smaller values appear earlier.

It affects two main places:

1. The list page sort modes:
   - when "recommend first" is chosen, posts with `isRecommended: true` are shown first, ordered by `recommendRank`;
   - after recommended posts, the rest are sorted by publish time (usually newest first).
2. The "Recommended reading" block on the detail page:
   - it picks other recommended posts in the same language as candidates;
   - the current post is excluded from its own recommendation list.

Again, using `0, 10, 20...` gaps for `recommendRank` keeps things easy to tweak later.

## Global "remote control": environment variables

Besides per-post frontmatter, there is a global layer of configuration controlled by environment variables, usually defined in `.env`.

Blog-related switches include:

- `NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE`: how many posts to show per page in the list;
- `NEXT_PUBLIC_BLOG_CATEGORY_ENABLED`: whether to show category badges;
- `NEXT_PUBLIC_BLOG_TAGS_ENABLED`: whether to show tags;
- `NEXT_PUBLIC_BLOG_SERIES_ENABLED`: whether to show the series section;
- `NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED`: whether to show the recommended section;
- `NEXT_PUBLIC_BLOG_MODE`: whether the blog lives inside this app or links out to an external blog;
- `NEXT_PUBLIC_BLOG_URL`: external blog URL when using external mode.

For i18n and site information:

- `NEXT_PUBLIC_I18N`: whether to enable language switch;
- `NEXT_PUBLIC_SITE_TITLE` / `NEXT_PUBLIC_SITE_TITLE_EN`: site titles for different languages;
- navigation title, subtitle, profile description and similar fields also have localized variants.

## Putting it together: a complete example

Finally, let us revisit the Chinese `welcome.zh-CN.md` and look at a "fairly complete" frontmatter example:

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

You can copy this block as a starting point for new posts and then tweak a few fields:

- choose your own `category.id` and labels;
- replace tags with the real topics this post focuses on;
- decide whether it should be pinned or recommended;
- if it belongs to a series, give all posts the same `series.id` with different `index` values.

After doing this a few times, you will probably feel that:

> "Writing a post" mostly means adding a few extra lines of frontmatter and letting the frontend take care of the rest.

