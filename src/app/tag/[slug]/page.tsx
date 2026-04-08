import { Metadata } from "next";
import TagDetail from "@/components/Blog/TagDetail";
import type { PostItem } from "@/utils/content/local";
import { cookies, headers } from "next/headers";
import { fetchPublicPostsList } from "@/server/content/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";

interface TagPageParams {
  slug: string;
}

/**
 * 生成标签页元信息。
 */
export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    title: `Tag - ${runtimeConfig.NEXT_PUBLIC_SITE_TITLE}`,
  };
}

export const revalidate = 3600;

/**
 * 标签详情页。
 * 首屏根据语言信息预取标签文章列表。
 */
export default async function TagPage({ params }: { params: Promise<TagPageParams> }) {
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
  return <TagDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
