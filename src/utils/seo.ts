import { parseSeoStructuredFromRuntime } from "@/config/runtimeStructuredData";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

interface SeoConfig {
  siteUrl: string;
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  twitterSite: string;
  sitemap: {
    changeFrequency: string;
    priority: number;
  };
}

const ensureNoTrailingSlash = (value: string) => {
  if (!value) return value;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const ensureLeadingSlash = (value: string) => {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
};

/**
 * 基于运行时配置构建 SEO 配置。
 *
 * @param runtimeConfig Runtime Public Config 快照
 * @returns 标准 SEO 配置
 */
export function buildSeoConfigFromRuntime(runtimeConfig: {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_SITE_TITLE: string;
  NEXT_PUBLIC_SITE_DESCRIPTION: string;
  NEXT_PUBLIC_SITE_NAME?: string;
  NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE?: string;
  NEXT_PUBLIC_SEO_TWITTER_HANDLE?: string;
  NEXT_PUBLIC_SEO_TWITTER_SITE?: string;
  NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY?: string;
  NEXT_PUBLIC_SEO_SITEMAP_PRIORITY?: number;
}): SeoConfig {
  const structured = parseSeoStructuredFromRuntime({
    NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE: runtimeConfig.NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE || "",
    NEXT_PUBLIC_SEO_TWITTER_HANDLE: runtimeConfig.NEXT_PUBLIC_SEO_TWITTER_HANDLE || "",
    NEXT_PUBLIC_SEO_TWITTER_SITE: runtimeConfig.NEXT_PUBLIC_SEO_TWITTER_SITE || "",
    NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY: runtimeConfig.NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY || "weekly",
    NEXT_PUBLIC_SEO_SITEMAP_PRIORITY: runtimeConfig.NEXT_PUBLIC_SEO_SITEMAP_PRIORITY ?? 0.7,
  });

  return {
    siteUrl: ensureNoTrailingSlash(runtimeConfig.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    siteName: runtimeConfig.NEXT_PUBLIC_SITE_NAME || runtimeConfig.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultTitle: runtimeConfig.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultDescription: runtimeConfig.NEXT_PUBLIC_SITE_DESCRIPTION || "",
    defaultOgImage: structured.defaultOgImage || "",
    twitterHandle: structured.twitterHandle || "",
    twitterSite: structured.twitterSite || "",
    sitemap: {
      changeFrequency: structured.sitemap.changeFrequency || "weekly",
      priority: structured.sitemap.priority,
    },
  };
}

/**
 * 服务端读取 SEO 配置。
 *
 * @returns 当前生效 SEO 配置
 */
export async function getSeoConfig(): Promise<SeoConfig> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return buildSeoConfigFromRuntime(runtimeConfig);
}

/**
 * 基于站点域名拼接绝对地址。
 *
 * @param siteUrl 站点域名
 * @param pathname 路径
 * @returns 绝对 URL
 */
export const buildUrl = (siteUrl: string, pathname: string) => {
  const safePath = ensureLeadingSlash(pathname);
  return `${ensureNoTrailingSlash(siteUrl)}${safePath}`;
};
