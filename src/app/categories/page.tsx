import { Metadata } from "next";
import CategoriesPage from "@/components/Blog/CategoriesPage";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

/**
 * 生成分类页元信息。
 * @returns 页面元信息
 */
export async function generateMetadata(): Promise<Metadata> {
    const config = await getServerRuntimePublicConfig();
    return {
        title: `Categories - ${config.NEXT_PUBLIC_SITE_TITLE}`,
        description: "All categories of posts",
    };
}

export const revalidate = 3600;

export default function CategoriesRoutePage() {
    return <CategoriesPage />;
}
