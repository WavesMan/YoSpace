import Blog from "@/components/Blog/Blog";
import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { fetchPublicPostsList } from "@/server/content/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";

/**
 * 生成博客页元信息。
 * 标题来源统一读取 Runtime Public Config。
 */
export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  return {
    title: `Blog - ${runtimeConfig.NEXT_PUBLIC_SITE_TITLE}`,
    description: "My thoughts and writings",
  };
}

export const revalidate = 3600;

/**
 * 博客列表页。
 * 首屏根据 cookie 与请求头推断语言，并按运行时配置读取分页大小。
 */
export default async function BlogPage() {
  const runtimeConfig = await getServerRuntimePublicConfig();
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
  const itemsLimit = runtimeConfig.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE;
  let initialData;

  try {
    initialData = await fetchPublicPostsList(0, itemsLimit, locale);
  } catch (error) {
    console.error("Failed to fetch initial blog posts", error);
  }

  return (
    <Blog
      initialPosts={initialData?.items}
      initialTotal={initialData?.total}
      initialLocale={locale}
    />
  );
}
