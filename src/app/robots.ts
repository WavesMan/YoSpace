import { MetadataRoute } from "next";
import { buildUrl, getSeoConfig } from "@/utils/seo";

/**
 * 生成 robots 配置。
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seoConfig = await getSeoConfig();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: buildUrl(seoConfig.siteUrl, "/sitemap.xml"),
    host: seoConfig.siteUrl,
  };
}
