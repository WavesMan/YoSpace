export type RuntimeConfigType = "string" | "number" | "boolean";

export interface RuntimeConfigDefinition<T = string | number | boolean> {
  key: string;
  label: string;
  type: RuntimeConfigType;
  isPublic: boolean;
  defaultValue: T;
  description: string;
}

/**
 * 运行时配置注册表。
 * 统一维护配置键、类型、默认值与可见性，避免业务侧散落硬编码。
 */
export const RUNTIME_CONFIG_DEFINITIONS: RuntimeConfigDefinition[] = [
  { key: "NEXT_PUBLIC_SITE_TITLE", label: "站点标题", type: "string", isPublic: true, defaultValue: "YoSpace", description: "浏览器默认标题。" },
  { key: "NEXT_PUBLIC_SITE_TITLE_EN", label: "站点标题（英文）", type: "string", isPublic: true, defaultValue: "YoSpace", description: "英文环境下的站点标题。" },
  { key: "NEXT_PUBLIC_SITE_DESCRIPTION", label: "站点描述", type: "string", isPublic: true, defaultValue: "从群众出发，扎根群众。向前，无限进步", description: "站点默认描述。" },
  { key: "NEXT_PUBLIC_SITE_DESCRIPTION_EN", label: "站点描述（英文）", type: "string", isPublic: true, defaultValue: "From the people, rooted in the people, always moving forward.", description: "英文环境下的站点描述。" },
  { key: "NEXT_PUBLIC_SITE_URL", label: "站点地址", type: "string", isPublic: true, defaultValue: "http://localhost:3000", description: "用于 SEO、订阅与站点地图的基础地址。" },
  { key: "NEXT_PUBLIC_NAV_TITLE", label: "导航标题", type: "string", isPublic: true, defaultValue: "YoSpace", description: "导航栏显示标题。" },
  { key: "NEXT_PUBLIC_NAV_TITLE_EN", label: "导航标题（英文）", type: "string", isPublic: true, defaultValue: "YoSpace", description: "英文环境下导航栏显示标题。" },
  { key: "NEXT_PUBLIC_I18N", label: "启用国际化", type: "boolean", isPublic: true, defaultValue: true, description: "是否启用中英文切换。" },
  { key: "NEXT_PUBLIC_DEFAULT_LOCALE", label: "默认语言", type: "string", isPublic: true, defaultValue: "zh-CN", description: "默认 UI 语言，仅支持 zh-CN 或 en-US。" },
  { key: "NEXT_PUBLIC_SUPPORTED_LOCALES", label: "可用语言列表", type: "string", isPublic: true, defaultValue: "zh-CN,en-US", description: "前台支持语言列表，逗号分隔。" },
  { key: "NEXT_PUBLIC_PROFILE_NAMES", label: "个人名称列表", type: "string", isPublic: true, defaultValue: "WaveYo,Waves_Man", description: "中文环境展示名称，逗号分隔。" },
  { key: "NEXT_PUBLIC_PROFILE_NAMES_EN", label: "个人名称列表（英文）", type: "string", isPublic: true, defaultValue: "WaveYo,Future", description: "英文环境展示名称，逗号分隔。" },
  { key: "NEXT_PUBLIC_PROFILE_IMAGE", label: "个人头像地址", type: "string", isPublic: true, defaultValue: "/WaveYo.jpg", description: "首页头像地址。" },
  { key: "NEXT_PUBLIC_FAVICON_URL", label: "Favicon 地址", type: "string", isPublic: true, defaultValue: "/favicon.ico", description: "站点图标地址。" },
  { key: "NEXT_PUBLIC_BLOG_MODE", label: "博客模式", type: "string", isPublic: true, defaultValue: "internal", description: "博客模式：internal 或 external。" },
  { key: "NEXT_PUBLIC_BLOG_URL", label: "外部博客地址", type: "string", isPublic: true, defaultValue: "", description: "当博客模式为 external 时使用的跳转地址。" },
  { key: "NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE", label: "博客每页条数", type: "number", isPublic: true, defaultValue: 10, description: "博客列表分页大小。" },
  { key: "NEXT_PUBLIC_BLOG_CATEGORY_ENABLED", label: "显示分类", type: "boolean", isPublic: true, defaultValue: true, description: "是否显示分类模块。" },
  { key: "NEXT_PUBLIC_BLOG_TAGS_ENABLED", label: "显示标签", type: "boolean", isPublic: true, defaultValue: true, description: "是否显示标签模块。" },
  { key: "NEXT_PUBLIC_BLOG_SERIES_ENABLED", label: "显示系列", type: "boolean", isPublic: true, defaultValue: true, description: "是否显示系列模块。" },
  { key: "NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED", label: "显示推荐", type: "boolean", isPublic: true, defaultValue: true, description: "是否显示推荐模块。" },
  { key: "NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY", label: "分类标签策略", type: "string", isPublic: true, defaultValue: "i18n-first", description: "分类标签策略：i18n-first 或 frontmatter-first。" },
  { key: "NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE", label: "标签最大展示数", type: "number", isPublic: true, defaultValue: 3, description: "博客卡片展示标签数量。" },
  { key: "NEXT_PUBLIC_BLOG_CATEGORY_POSITION", label: "分类展示位置", type: "string", isPublic: true, defaultValue: "above-title", description: "分类展示位置：above-title、inline-title 或 hidden。" },
  { key: "NEXT_PUBLIC_BLOG_PINNED_STYLE", label: "置顶展示样式", type: "string", isPublic: true, defaultValue: "separate-section", description: "置顶文章展示样式。" },
  { key: "NEXT_PUBLIC_BLOG_RELATED_LIMIT", label: "关联文章拉取上限", type: "number", isPublic: true, defaultValue: 50, description: "详情页用于推荐与系列计算的拉取上限。" },
  { key: "NEXT_PUBLIC_MUSIC_API_BASE", label: "音乐 API 地址", type: "string", isPublic: true, defaultValue: "https://netmusic.waveyo.cn/", description: "音乐播放器数据源地址。" },
  { key: "NEXT_PUBLIC_MUSIC_PLAYLIST_ID", label: "音乐歌单 ID", type: "string", isPublic: true, defaultValue: "12752948320", description: "全站默认歌单 ID。" },
  { key: "NEXT_PUBLIC_RSS_FEED_PATH", label: "RSS 路径", type: "string", isPublic: true, defaultValue: "/feeds/rss.xml", description: "RSS 订阅地址路径。" },
  { key: "NEXT_PUBLIC_ATOM_FEED_PATH", label: "ATOM 路径", type: "string", isPublic: true, defaultValue: "/feeds/atom.xml", description: "ATOM 订阅地址路径。" },
  { key: "NEXT_PUBLIC_ICP_CODE", label: "ICP 备案号", type: "string", isPublic: true, defaultValue: "", description: "页脚工信部备案号。" },
  { key: "NEXT_PUBLIC_POLICE_LICENSE", label: "公安备案号", type: "string", isPublic: true, defaultValue: "", description: "页脚公安备案号。" },
  { key: "NEXT_PUBLIC_SITE_NAME", label: "站点名称", type: "string", isPublic: true, defaultValue: "WaveYo", description: "页脚版权名称。" },
  { key: "NEXT_PUBLIC_SITE_START_YEAR", label: "站点起始年份", type: "string", isPublic: true, defaultValue: "", description: "页脚版权起始年份。" },
  { key: "NEXT_PUBLIC_USE_DB_CONTENT", label: "使用数据库内容源", type: "boolean", isPublic: false, defaultValue: true, description: "博客内容源开关。" },
  { key: "NEXT_PUBLIC_ADMIN_PATH", label: "后台入口路径", type: "string", isPublic: false, defaultValue: "/admin", description: "后台统一入口路径。" },
];

export const RUNTIME_CONFIG_KEY_SET = new Set(RUNTIME_CONFIG_DEFINITIONS.map((item) => item.key));

export const RUNTIME_CONFIG_MAP = new Map(
  RUNTIME_CONFIG_DEFINITIONS.map((item) => [item.key, item]),
);
