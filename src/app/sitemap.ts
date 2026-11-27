import type { MetadataRoute } from "next";
import { getLocalPostsList } from "@/utils/content/local";
import { buildUrl, toSeoDate } from "@/utils/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const { items } = await getLocalPostsList(0, Number.MAX_SAFE_INTEGER, "zh-CN");
    const categories = new Set<string>();
    const tags = new Map<string, number>();

    for (const post of items) {
        if (post.category) categories.add(post.category.id);
        for (const tag of new Set(post.tags)) tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }

    return [
        ...["/", "/blog", "/archive", "/categories", "/tags"].map(path => ({ url: buildUrl(path) })),
        ...items.map(post => ({
            url: buildUrl(`/blog/${encodeURIComponent(post.slug)}`),
            lastModified: toSeoDate(post.updatedTime) ?? toSeoDate(post.publishedTime),
        })),
        ...Array.from(categories, id => ({ url: buildUrl(`/category/${encodeURIComponent(id)}`) })),
        ...Array.from(tags).filter(([, count]) => count >= 2)
            .map(([tag]) => ({ url: buildUrl(`/tag/${encodeURIComponent(tag)}`) })),
    ];
}
