import type { RuntimePublicConfig } from "@/config/runtimePublicConfig";

export interface NavigationLocaleText {
  zh: string;
  en: string;
}

export interface NavigationFavicon {
  type: "auto" | "url" | "local";
  value?: string;
}

export interface NavigationItem {
  id: string;
  name: NavigationLocaleText;
  desc: NavigationLocaleText;
  url: string;
  favicon?: NavigationFavicon;
}

export interface RuntimeSocialLink {
  name: string;
  url: string;
  iconUrl?: string;
  iconPackage?: string;
  iconName?: string;
}

export interface RuntimeFriendLink {
  title: string;
  avatar: string;
  subtitle?: string;
  link: string;
}

export interface RuntimeSeoStructuredData {
  defaultOgImage: string;
  twitterHandle: string;
  twitterSite: string;
  sitemap: {
    changeFrequency: string;
    priority: number;
  };
}

const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [];
const DEFAULT_SOCIAL_LINKS: RuntimeSocialLink[] = [];
const DEFAULT_FRIEND_LINKS: RuntimeFriendLink[] = [];

/**
 * 安全解析 JSON 字符串。
 *
 * @param raw 原始 JSON 字符串
 * @returns 解析结果
 */
function parseJsonSafely(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 将未知值校验并转换为字符串。
 *
 * @param value 原始值
 * @returns 安全字符串
 */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 解析首页导航配置。
 *
 * @param config Runtime Public Config
 * @returns 导航项列表
 */
export function parseNavigationItemsFromRuntime(config: RuntimePublicConfig): NavigationItem[] {
  const parsed = parseJsonSafely(config.NEXT_PUBLIC_NAVIGATION_ITEMS);
  if (!Array.isArray(parsed)) {
    return DEFAULT_NAVIGATION_ITEMS;
  }

  const items: NavigationItem[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const id = asString(record.id);
    const url = asString(record.url);
    const nameRaw = record.name as Record<string, unknown> | undefined;
    const descRaw = record.desc as Record<string, unknown> | undefined;
    const nameZh = asString(nameRaw?.zh);
    const nameEn = asString(nameRaw?.en);
    const descZh = asString(descRaw?.zh);
    const descEn = asString(descRaw?.en);

    if (!id || !url || !nameZh || !nameEn) {
      continue;
    }

    const faviconRaw = record.favicon as Record<string, unknown> | undefined;
    const faviconType = asString(faviconRaw?.type);
    const favicon: NavigationFavicon | undefined =
      faviconType === "auto" || faviconType === "url" || faviconType === "local"
        ? { type: faviconType, value: asString(faviconRaw?.value) || undefined }
        : undefined;

    items.push({
      id,
      url,
      name: { zh: nameZh, en: nameEn },
      desc: { zh: descZh, en: descEn },
      favicon,
    });
  }
  return items;
}

/**
 * 解析个人社交链接配置。
 *
 * @param config Runtime Public Config
 * @returns 社交链接列表
 */
export function parseProfileSocialLinksFromRuntime(config: RuntimePublicConfig): RuntimeSocialLink[] {
  const parsed = parseJsonSafely(config.NEXT_PUBLIC_PROFILE_SOCIAL_LINKS);
  if (!Array.isArray(parsed)) {
    return DEFAULT_SOCIAL_LINKS;
  }

  const items: RuntimeSocialLink[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = asString(record.name);
    const url = asString(record.url);
    if (!name || !url) {
      continue;
    }
    items.push({
      name,
      url,
      iconUrl: asString(record.iconUrl) || undefined,
      iconPackage: asString(record.iconPackage) || undefined,
      iconName: asString(record.iconName) || undefined,
    });
  }
  return items;
}

/**
 * 解析友链配置。
 *
 * @param config Runtime Public Config
 * @returns 友链列表
 */
export function parseFriendLinksFromRuntime(config: RuntimePublicConfig): RuntimeFriendLink[] {
  const parsed = parseJsonSafely(config.NEXT_PUBLIC_FRIEND_LINKS);
  if (!Array.isArray(parsed)) {
    return DEFAULT_FRIEND_LINKS;
  }

  const items: RuntimeFriendLink[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const title = asString(record.title);
    const link = asString(record.link);
    const avatar = asString(record.avatar);
    if (!title || !link || !avatar) {
      continue;
    }
    items.push({
      title,
      link,
      avatar,
      subtitle: asString(record.subtitle) || undefined,
    });
  }
  return items;
}

/**
 * 解析 SEO 结构化配置。
 *
 * @param config Runtime Public Config
 * @returns SEO 配置片段
 */
export function parseSeoStructuredFromRuntime(config: {
  NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE: string;
  NEXT_PUBLIC_SEO_TWITTER_HANDLE: string;
  NEXT_PUBLIC_SEO_TWITTER_SITE: string;
  NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY: string;
  NEXT_PUBLIC_SEO_SITEMAP_PRIORITY: number;
}): RuntimeSeoStructuredData {
  return {
    defaultOgImage: config.NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE,
    twitterHandle: config.NEXT_PUBLIC_SEO_TWITTER_HANDLE,
    twitterSite: config.NEXT_PUBLIC_SEO_TWITTER_SITE,
    sitemap: {
      changeFrequency: config.NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY || "weekly",
      priority: Math.min(1, Math.max(0, config.NEXT_PUBLIC_SEO_SITEMAP_PRIORITY)),
    },
  };
}
