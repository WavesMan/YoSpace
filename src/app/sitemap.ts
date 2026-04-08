import { MetadataRoute } from "next";
import { buildUrl, getSeoConfig } from "@/utils/seo";
import { fetchPublicPostSlugs, fetchPublicPostsList } from "@/server/content/service";

/**
 * 生成站点地图。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seoConfig = await getSeoConfig();
  const now = new Date();
  const list = await fetchPublicPostsList(0, 5000, "en");
  const slugs = await fetchPublicPostSlugs();

  const tagSet = new Set<string>();
  const categorySet = new Set<string>();
  const dateMap = new Map<string, string>();

  list.items.forEach((item) => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach((tag) => tagSet.add(tag));
    }
    if (item.category?.id) {
      categorySet.add(item.category.id);
    }
    if (item.slug && item.publishedTime) {
      dateMap.set(item.slug, item.publishedTime);
    }
  });

  const baseFrequency = seoConfig.sitemap.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"];
  const basePriority = seoConfig.sitemap.priority;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: buildUrl(seoConfig.siteUrl, "/"),
      lastModified: now,
      changeFrequency: baseFrequency,
      priority: basePriority,
    },
    {
      url: buildUrl(seoConfig.siteUrl, "/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildUrl(seoConfig.siteUrl, "/tags"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: buildUrl(seoConfig.siteUrl, "/categories"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = slugs.map((item) => {
    const date = dateMap.get(item.slug);
    return {
      url: buildUrl(seoConfig.siteUrl, `/blog/${encodeURIComponent(item.slug)}`),
      lastModified: date ? new Date(date) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  const tagEntries: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
    url: buildUrl(seoConfig.siteUrl, `/tag/${encodeURIComponent(tag)}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const categoryEntries: MetadataRoute.Sitemap = Array.from(categorySet).map((categoryId) => ({
    url: buildUrl(seoConfig.siteUrl, `/category/${encodeURIComponent(categoryId)}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [
    ...staticEntries,
    ...postEntries,
    ...tagEntries,
    ...categoryEntries,
  ];
}
