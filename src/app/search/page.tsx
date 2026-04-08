import { Metadata } from "next";
import SearchPage from "@/components/Blog/SearchPage";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";

/**
 * 生成搜索页元信息。
 */
export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    title: `Search - ${runtimeConfig.NEXT_PUBLIC_SITE_TITLE}`,
    description: "Search posts on this site",
  };
}

export const revalidate = 3600;

export default function SearchRoutePage() {
  return <SearchPage />;
}
