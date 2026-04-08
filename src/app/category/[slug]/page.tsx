import { Metadata } from "next";
import CategoryDetail from "@/components/Blog/CategoryDetail";
import type { PostItem } from "@/utils/content/local";
import { cookies, headers } from "next/headers";
import { fetchPublicPostsList } from "@/server/content/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";

interface CategoryPageParams {
  slug: string;
}

/**
 * 生成分类页元信息。
 */
export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    title: `Category - ${runtimeConfig.NEXT_PUBLIC_SITE_TITLE}`,
  };
}

export const revalidate = 3600;

/**
 * 分类详情页。
 * 首屏根据语言信息预取分类文章列表。
 */
export default async function CategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
  const runtimeConfig = await getServerRuntimePublicConfig();
  const { slug } = await params;
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("locale")?.value;
  const requestHeaders = await headers();
  const acceptLang = requestHeaders.get("accept-language")?.toLowerCase() || "";
  const i18nConfig = resolveI18nRuntimeConfig(runtimeConfig);
  const uiLocale = i18nConfig.enabled && (savedLocale === "en-US" || savedLocale === "zh-CN")
    ? savedLocale
    : acceptLang.startsWith("en")
      ? "en-US"
      : "zh-CN";
  const locale = resolveContentLocale(uiLocale, runtimeConfig);
  let initialPosts: PostItem[];
  try {
    const list = await fetchPublicPostsList(0, 2000, locale);
    initialPosts = list.items;
  } catch {
    initialPosts = [];
  }
  return <CategoryDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
