export interface RuntimePublicConfig {
  NEXT_PUBLIC_SITE_TITLE: string;
  NEXT_PUBLIC_SITE_TITLE_EN: string;
  NEXT_PUBLIC_SITE_DESCRIPTION: string;
  NEXT_PUBLIC_SITE_DESCRIPTION_EN: string;
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_NAV_TITLE: string;
  NEXT_PUBLIC_NAV_TITLE_EN: string;
  NEXT_PUBLIC_I18N: boolean;
  NEXT_PUBLIC_DEFAULT_LOCALE: "zh-CN" | "en-US";
  NEXT_PUBLIC_SUPPORTED_LOCALES: string;
  NEXT_PUBLIC_PROFILE_NAMES: string;
  NEXT_PUBLIC_PROFILE_NAMES_EN: string;
  NEXT_PUBLIC_PROFILE_IMAGE: string;
  NEXT_PUBLIC_FAVICON_URL: string;
  NEXT_PUBLIC_BLOG_MODE: "internal" | "external";
  NEXT_PUBLIC_BLOG_URL: string;
  NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: number;
  NEXT_PUBLIC_BLOG_CATEGORY_ENABLED: boolean;
  NEXT_PUBLIC_BLOG_TAGS_ENABLED: boolean;
  NEXT_PUBLIC_BLOG_SERIES_ENABLED: boolean;
  NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED: boolean;
  NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY: string;
  NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE: number;
  NEXT_PUBLIC_BLOG_CATEGORY_POSITION: string;
  NEXT_PUBLIC_BLOG_PINNED_STYLE: string;
  NEXT_PUBLIC_BLOG_RELATED_LIMIT: number;
  NEXT_PUBLIC_MUSIC_API_BASE: string;
  NEXT_PUBLIC_MUSIC_PLAYLIST_ID: string;
  NEXT_PUBLIC_RSS_FEED_PATH: string;
  NEXT_PUBLIC_ATOM_FEED_PATH: string;
  NEXT_PUBLIC_ICP_CODE: string;
  NEXT_PUBLIC_POLICE_LICENSE: string;
  NEXT_PUBLIC_SITE_NAME: string;
  NEXT_PUBLIC_SITE_START_YEAR: string;
}

export const DEFAULT_RUNTIME_PUBLIC_CONFIG: RuntimePublicConfig = {
  NEXT_PUBLIC_SITE_TITLE: "YoSpace",
  NEXT_PUBLIC_SITE_TITLE_EN: "YoSpace",
  NEXT_PUBLIC_SITE_DESCRIPTION: "从群众出发，扎根群众。向前，无限进步",
  NEXT_PUBLIC_SITE_DESCRIPTION_EN: "From the people, rooted in the people, always moving forward.",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_NAV_TITLE: "YoSpace",
  NEXT_PUBLIC_NAV_TITLE_EN: "YoSpace",
  NEXT_PUBLIC_I18N: true,
  NEXT_PUBLIC_DEFAULT_LOCALE: "zh-CN",
  NEXT_PUBLIC_SUPPORTED_LOCALES: "zh-CN,en-US",
  NEXT_PUBLIC_PROFILE_NAMES: "WaveYo,Waves_Man",
  NEXT_PUBLIC_PROFILE_NAMES_EN: "WaveYo,Future",
  NEXT_PUBLIC_PROFILE_IMAGE: "/WaveYo.jpg",
  NEXT_PUBLIC_FAVICON_URL: "/favicon.ico",
  NEXT_PUBLIC_BLOG_MODE: "internal",
  NEXT_PUBLIC_BLOG_URL: "",
  NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: 10,
  NEXT_PUBLIC_BLOG_CATEGORY_ENABLED: true,
  NEXT_PUBLIC_BLOG_TAGS_ENABLED: true,
  NEXT_PUBLIC_BLOG_SERIES_ENABLED: true,
  NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED: true,
  NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY: "i18n-first",
  NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE: 3,
  NEXT_PUBLIC_BLOG_CATEGORY_POSITION: "above-title",
  NEXT_PUBLIC_BLOG_PINNED_STYLE: "separate-section",
  NEXT_PUBLIC_BLOG_RELATED_LIMIT: 50,
  NEXT_PUBLIC_MUSIC_API_BASE: "https://netmusic.waveyo.cn/",
  NEXT_PUBLIC_MUSIC_PLAYLIST_ID: "12752948320",
  NEXT_PUBLIC_RSS_FEED_PATH: "/feeds/rss.xml",
  NEXT_PUBLIC_ATOM_FEED_PATH: "/feeds/atom.xml",
  NEXT_PUBLIC_ICP_CODE: "",
  NEXT_PUBLIC_POLICE_LICENSE: "",
  NEXT_PUBLIC_SITE_NAME: "WaveYo",
  NEXT_PUBLIC_SITE_START_YEAR: "",
};

const toStringValue = (value: unknown, fallback: string): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const toBooleanValue = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
};

const toNumberValue = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * 将输入配置规整为完整 Runtime Public Config。
 * @param source 原始配置对象
 * @returns 标准化配置
 */
export function normalizeRuntimePublicConfig(source: unknown): RuntimePublicConfig {
  const input = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const fallback = DEFAULT_RUNTIME_PUBLIC_CONFIG;
  return {
    NEXT_PUBLIC_SITE_TITLE: toStringValue(input.NEXT_PUBLIC_SITE_TITLE, fallback.NEXT_PUBLIC_SITE_TITLE),
    NEXT_PUBLIC_SITE_TITLE_EN: toStringValue(input.NEXT_PUBLIC_SITE_TITLE_EN, fallback.NEXT_PUBLIC_SITE_TITLE_EN),
    NEXT_PUBLIC_SITE_DESCRIPTION: toStringValue(input.NEXT_PUBLIC_SITE_DESCRIPTION, fallback.NEXT_PUBLIC_SITE_DESCRIPTION),
    NEXT_PUBLIC_SITE_DESCRIPTION_EN: toStringValue(input.NEXT_PUBLIC_SITE_DESCRIPTION_EN, fallback.NEXT_PUBLIC_SITE_DESCRIPTION_EN),
    NEXT_PUBLIC_SITE_URL: toStringValue(input.NEXT_PUBLIC_SITE_URL, fallback.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_NAV_TITLE: toStringValue(input.NEXT_PUBLIC_NAV_TITLE, fallback.NEXT_PUBLIC_NAV_TITLE),
    NEXT_PUBLIC_NAV_TITLE_EN: toStringValue(input.NEXT_PUBLIC_NAV_TITLE_EN, fallback.NEXT_PUBLIC_NAV_TITLE_EN),
    NEXT_PUBLIC_I18N: toBooleanValue(input.NEXT_PUBLIC_I18N, fallback.NEXT_PUBLIC_I18N),
    NEXT_PUBLIC_DEFAULT_LOCALE:
      toStringValue(input.NEXT_PUBLIC_DEFAULT_LOCALE, fallback.NEXT_PUBLIC_DEFAULT_LOCALE) === "en-US"
        ? "en-US"
        : "zh-CN",
    NEXT_PUBLIC_SUPPORTED_LOCALES: toStringValue(
      input.NEXT_PUBLIC_SUPPORTED_LOCALES,
      fallback.NEXT_PUBLIC_SUPPORTED_LOCALES,
    ),
    NEXT_PUBLIC_PROFILE_NAMES: toStringValue(input.NEXT_PUBLIC_PROFILE_NAMES, fallback.NEXT_PUBLIC_PROFILE_NAMES),
    NEXT_PUBLIC_PROFILE_NAMES_EN: toStringValue(input.NEXT_PUBLIC_PROFILE_NAMES_EN, fallback.NEXT_PUBLIC_PROFILE_NAMES_EN),
    NEXT_PUBLIC_PROFILE_IMAGE: toStringValue(input.NEXT_PUBLIC_PROFILE_IMAGE, fallback.NEXT_PUBLIC_PROFILE_IMAGE),
    NEXT_PUBLIC_FAVICON_URL: toStringValue(input.NEXT_PUBLIC_FAVICON_URL, fallback.NEXT_PUBLIC_FAVICON_URL),
    NEXT_PUBLIC_BLOG_MODE:
      toStringValue(input.NEXT_PUBLIC_BLOG_MODE, fallback.NEXT_PUBLIC_BLOG_MODE) === "external"
        ? "external"
        : "internal",
    NEXT_PUBLIC_BLOG_URL: toStringValue(input.NEXT_PUBLIC_BLOG_URL, fallback.NEXT_PUBLIC_BLOG_URL),
    NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: toNumberValue(
      input.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE,
      fallback.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE,
    ),
    NEXT_PUBLIC_BLOG_CATEGORY_ENABLED: toBooleanValue(
      input.NEXT_PUBLIC_BLOG_CATEGORY_ENABLED,
      fallback.NEXT_PUBLIC_BLOG_CATEGORY_ENABLED,
    ),
    NEXT_PUBLIC_BLOG_TAGS_ENABLED: toBooleanValue(
      input.NEXT_PUBLIC_BLOG_TAGS_ENABLED,
      fallback.NEXT_PUBLIC_BLOG_TAGS_ENABLED,
    ),
    NEXT_PUBLIC_BLOG_SERIES_ENABLED: toBooleanValue(
      input.NEXT_PUBLIC_BLOG_SERIES_ENABLED,
      fallback.NEXT_PUBLIC_BLOG_SERIES_ENABLED,
    ),
    NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED: toBooleanValue(
      input.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED,
      fallback.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED,
    ),
    NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY: toStringValue(
      input.NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY,
      fallback.NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY,
    ),
    NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE: toNumberValue(
      input.NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE,
      fallback.NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE,
    ),
    NEXT_PUBLIC_BLOG_CATEGORY_POSITION: toStringValue(
      input.NEXT_PUBLIC_BLOG_CATEGORY_POSITION,
      fallback.NEXT_PUBLIC_BLOG_CATEGORY_POSITION,
    ),
    NEXT_PUBLIC_BLOG_PINNED_STYLE: toStringValue(input.NEXT_PUBLIC_BLOG_PINNED_STYLE, fallback.NEXT_PUBLIC_BLOG_PINNED_STYLE),
    NEXT_PUBLIC_BLOG_RELATED_LIMIT: toNumberValue(input.NEXT_PUBLIC_BLOG_RELATED_LIMIT, fallback.NEXT_PUBLIC_BLOG_RELATED_LIMIT),
    NEXT_PUBLIC_MUSIC_API_BASE: toStringValue(input.NEXT_PUBLIC_MUSIC_API_BASE, fallback.NEXT_PUBLIC_MUSIC_API_BASE),
    NEXT_PUBLIC_MUSIC_PLAYLIST_ID: toStringValue(
      input.NEXT_PUBLIC_MUSIC_PLAYLIST_ID,
      fallback.NEXT_PUBLIC_MUSIC_PLAYLIST_ID,
    ),
    NEXT_PUBLIC_RSS_FEED_PATH: toStringValue(input.NEXT_PUBLIC_RSS_FEED_PATH, fallback.NEXT_PUBLIC_RSS_FEED_PATH),
    NEXT_PUBLIC_ATOM_FEED_PATH: toStringValue(input.NEXT_PUBLIC_ATOM_FEED_PATH, fallback.NEXT_PUBLIC_ATOM_FEED_PATH),
    NEXT_PUBLIC_ICP_CODE: toStringValue(input.NEXT_PUBLIC_ICP_CODE, fallback.NEXT_PUBLIC_ICP_CODE),
    NEXT_PUBLIC_POLICE_LICENSE: toStringValue(input.NEXT_PUBLIC_POLICE_LICENSE, fallback.NEXT_PUBLIC_POLICE_LICENSE),
    NEXT_PUBLIC_SITE_NAME: toStringValue(input.NEXT_PUBLIC_SITE_NAME, fallback.NEXT_PUBLIC_SITE_NAME),
    NEXT_PUBLIC_SITE_START_YEAR: toStringValue(input.NEXT_PUBLIC_SITE_START_YEAR, fallback.NEXT_PUBLIC_SITE_START_YEAR),
  };
}

/**
 * 将逗号分隔语言字符串拆分为有序语言列表。
 * @param raw 原始语言字符串
 * @returns 语言列表
 */
export function parseSupportedUiLocales(raw: string): Array<"zh-CN" | "en-US"> {
  const tokens = raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const locales: Array<"zh-CN" | "en-US"> = [];
  for (const token of tokens) {
    if ((token === "zh-CN" || token === "en-US") && !locales.includes(token)) {
      locales.push(token);
    }
  }
  return locales.length > 0 ? locales : ["zh-CN", "en-US"];
}
