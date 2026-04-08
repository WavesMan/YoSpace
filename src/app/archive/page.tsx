import { Metadata } from "next";
import Archive from "@/components/Blog/Archive";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

/**
 * 生成归档页元信息。
 * @returns 页面元信息
 */
export async function generateMetadata(): Promise<Metadata> {
    const config = await getServerRuntimePublicConfig();
    return {
        title: `Archive - ${config.NEXT_PUBLIC_SITE_TITLE}`,
        description: "Archive of all posts grouped by year and month",
    };
}

export const revalidate = 3600;

export default function ArchivePage() {
    return <Archive />;
}
