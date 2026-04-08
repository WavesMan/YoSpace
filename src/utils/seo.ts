import seoData from "@/data/seo.json";
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
 * @param runtimeConfig Runtime Public Config 快照
 * @returns 标准 SEO 配置
 */
export function buildSeoConfigFromRuntime(runtimeConfig: {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_SITE_TITLE: string;
  NEXT_PUBLIC_SITE_DESCRIPTION: string;
}): SeoConfig {
  return {
    siteUrl: ensureNoTrailingSlash(runtimeConfig.NEXT_PUBLIC_SITE_URL || seoData.siteUrl || "http://localhost:3000"),
    siteName: seoData.siteName || runtimeConfig.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultTitle: seoData.defaultTitle || runtimeConfig.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultDescription: seoData.defaultDescription || runtimeConfig.NEXT_PUBLIC_SITE_DESCRIPTION || "",
    defaultOgImage: seoData.defaultOgImage || "",
    twitterHandle: seoData.twitterHandle || "",
    twitterSite: seoData.twitterSite || "",
    sitemap: seoData.sitemap || { changeFrequency: "weekly", priority: 0.7 },
  };
}

/**
 * 服务端读取 SEO 配置。
 * @returns 当前生效 SEO 配置
 */
export async function getSeoConfig(): Promise<SeoConfig> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return buildSeoConfigFromRuntime(runtimeConfig);
}

/**
 * 基于站点域名拼接绝对地址。
 * @param siteUrl 站点域名
 * @param pathname 路径
 * @returns 绝对 URL
 */
export const buildUrl = (siteUrl: string, pathname: string) => {
  const safePath = ensureLeadingSlash(pathname);
  return `${ensureNoTrailingSlash(siteUrl)}${safePath}`;
};
