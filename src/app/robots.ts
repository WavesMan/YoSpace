import { MetadataRoute } from "next";
import { buildUrl } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        sitemap: buildUrl("/sitemap.xml"),
    };
}
