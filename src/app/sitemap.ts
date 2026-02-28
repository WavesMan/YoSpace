import { MetadataRoute } from "next";
import { getAllLocalPostSlugs, getLocalPostsList } from "@/utils/content/local";
import { buildUrl, seoConfig } from "@/utils/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const list = await getLocalPostsList(0, 5000, "en");
    const slugs = await getAllLocalPostSlugs();

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
            url: buildUrl("/"),
            lastModified: now,
            changeFrequency: baseFrequency,
            priority: basePriority,
        },
        {
            url: buildUrl("/blog"),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: buildUrl("/tags"),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
        },
        {
            url: buildUrl("/categories"),
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
        },
    ];

    const postEntries: MetadataRoute.Sitemap = slugs.map((item) => {
        const date = dateMap.get(item.slug);
        return {
            url: buildUrl(`/blog/${encodeURIComponent(item.slug)}`),
            lastModified: date ? new Date(date) : now,
            changeFrequency: "monthly",
            priority: 0.6,
        };
    });

    const tagEntries: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
        url: buildUrl(`/tag/${encodeURIComponent(tag)}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
    }));

    const categoryEntries: MetadataRoute.Sitemap = Array.from(categorySet).map((categoryId) => ({
        url: buildUrl(`/category/${encodeURIComponent(categoryId)}`),
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
