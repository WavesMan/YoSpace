import { MetadataRoute } from "next";
import { buildUrl, seoConfig } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        sitemap: buildUrl("/sitemap.xml"),
        host: seoConfig.siteUrl,
    };
}
