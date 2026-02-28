import seoData from "@/data/seo.json";

const ensureNoTrailingSlash = (value: string) => {
    if (!value) return value;
    return value.endsWith("/") ? value.slice(0, -1) : value;
};

const ensureLeadingSlash = (value: string) => {
    if (!value) return "/";
    return value.startsWith("/") ? value : `/${value}`;
};

export const seoConfig = {
    siteUrl: ensureNoTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || seoData.siteUrl || "http://localhost:3000"),
    siteName: seoData.siteName || process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultTitle: seoData.defaultTitle || process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
    defaultDescription: seoData.defaultDescription || process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "",
    defaultOgImage: seoData.defaultOgImage || "",
    twitterHandle: seoData.twitterHandle || "",
    twitterSite: seoData.twitterSite || "",
    sitemap: seoData.sitemap || { changeFrequency: "weekly", priority: 0.7 },
};

export const buildUrl = (pathname: string) => {
    const safePath = ensureLeadingSlash(pathname);
    return `${seoConfig.siteUrl}${safePath}`;
};
