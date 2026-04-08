import { Metadata } from "next";
import TagsPage from "@/components/Blog/TagsPage";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

/**
 * 生成标签页元信息。
 * @returns 页面元信息
 */
export async function generateMetadata(): Promise<Metadata> {
    const config = await getServerRuntimePublicConfig();
    return {
        title: `Tags - ${config.NEXT_PUBLIC_SITE_TITLE}`,
        description: "All tags of posts",
    };
}

export const revalidate = 3600;

export default function TagsRoutePage() {
    return <TagsPage />;
}
