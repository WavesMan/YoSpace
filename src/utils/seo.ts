import type { Metadata } from "next";
import seoData from "@/data/seo.json";

export const seoConfig = seoData;

/** 在正式站点域名下生成绝对链接。 */
export function buildUrl(pathname: string) {
    return new URL(pathname, seoConfig.siteUrl).href;
}

/** 生成页面自己的 canonical 与分享元数据。 */
export function pageMetadata(pathname: string, title: string, description: string, absolute = false): Metadata {
    const pageTitle = absolute ? title : `${title} - ${seoConfig.siteName}`;
    const url = buildUrl(pathname);
    return {
        title: pageTitle,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: pageTitle,
            description,
            url,
            siteName: seoConfig.siteName,
            locale: "zh_CN",
            images: [buildUrl(seoConfig.defaultOgImage)],
        },
        twitter: { card: "summary_large_image", title: pageTitle, description, images: [buildUrl(seoConfig.defaultOgImage)] },
    };
}

/** 将内容日期转换为稳定的 ISO 时间，旧文章无时区的时间按北京时间处理。 */
export function toSeoDate(value?: string): string | undefined {
    if (!value) return;
    const localDate = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(value);
    const date = new Date(localDate ? `${localDate[1]}T${localDate[2]}+08:00` : value);
    if (Number.isFinite(date.getTime())) return date.toISOString();
}

/** 使 JSON-LD 可以安全放在 HTML 的 script 元素内。 */
export function serializeJsonLd(value: object) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** 第一页使用博客列表的规范路径，其余页保留页码。 */
export function blogPagePath(page: number) {
    return page === 1 ? "/blog" : `/blog?page=${page}`;
}
