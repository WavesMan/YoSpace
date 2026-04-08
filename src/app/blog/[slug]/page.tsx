import BlogPost from "@/components/Blog/BlogPost";
import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchPublicPostContentBySlug, fetchPublicPostSlugs } from "@/server/content/service";
import { trackPostView } from "@/server/analytics/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";
import { buildUrl, getSeoConfig } from "@/utils/seo";

export const revalidate = 3600;

/**
 * 解析博客详情页首屏语言。
 * 语言开关与默认值统一来自 Runtime Public Config。
 */
async function resolveBlogLocale(): Promise<string> {
  const runtimeConfig = await getServerRuntimePublicConfig();
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("locale")?.value;
  const requestHeaders = await headers();
  const acceptLang = requestHeaders.get("accept-language")?.toLowerCase() || "";
  const i18nConfig = resolveI18nRuntimeConfig(runtimeConfig);
  if (!i18nConfig.enabled) {
    return resolveContentLocale(null, runtimeConfig);
  }
  const uiLocale = savedLocale === "en-US" || savedLocale === "zh-CN"
    ? savedLocale
    : acceptLang.startsWith("en")
      ? "en-US"
      : "zh-CN";
  return resolveContentLocale(uiLocale, runtimeConfig);
}

/**
 * 预生成文章动态路由参数。
 */
export async function generateStaticParams() {
  try {
    const slugs = await fetchPublicPostSlugs();
    return slugs.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for blog posts:", error);
    return [];
  }
}

/**
 * 生成文章详情页元信息。
 * SEO 基础字段统一读取 Runtime Public Config。
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveBlogLocale();
  const seoConfig = await getSeoConfig();
  const ogImages = seoConfig.defaultOgImage ? [buildUrl(seoConfig.siteUrl, seoConfig.defaultOgImage)] : undefined;

  try {
    const result = await fetchPublicPostContentBySlug(slug, locale);
    const canonical = buildUrl(seoConfig.siteUrl, `/blog/${encodeURIComponent(result.resolvedSlug)}`);
    const title = `${result.content.title} - ${seoConfig.siteName}`;
    const descRaw = result.content.description || seoConfig.defaultDescription;
    const description = descRaw.replace(/\s+/g, " ").trim().slice(0, 180);
    const cardType = ogImages && ogImages.length > 0 ? "summary_large_image" : "summary";
    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: seoConfig.siteName,
        type: "article",
        images: ogImages,
      },
      twitter: {
        card: cardType,
        title,
        description,
        images: ogImages,
        site: seoConfig.twitterSite || undefined,
        creator: seoConfig.twitterHandle || undefined,
      },
    };
  } catch {
    const canonical = buildUrl(seoConfig.siteUrl, `/blog/${encodeURIComponent(slug)}`);
    const title = `${seoConfig.defaultTitle} - ${seoConfig.siteName}`;
    const description = seoConfig.defaultDescription.replace(/\s+/g, " ").trim().slice(0, 180);
    const cardType = ogImages && ogImages.length > 0 ? "summary_large_image" : "summary";
    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: seoConfig.siteName,
        type: "article",
        images: ogImages,
      },
      twitter: {
        card: cardType,
        title,
        description,
        images: ogImages,
        site: seoConfig.twitterSite || undefined,
        creator: seoConfig.twitterHandle || undefined,
      },
    };
  }
}

/**
 * 文章详情页。
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await resolveBlogLocale();
  const requestHeaders = await headers();
  let initialContent;

  try {
    const result = await fetchPublicPostContentBySlug(slug, locale);
    await trackPostView({
      slug: result.resolvedSlug,
      locale,
      path: `/blog/${encodeURIComponent(result.resolvedSlug)}`,
      headers: requestHeaders,
    });
    if (result.resolvedSlug !== slug) {
      redirect(`/blog/${encodeURIComponent(result.resolvedSlug)}`);
    }
    initialContent = result.content;
  } catch (error) {
    console.error(`Failed to fetch content for slug: ${slug}`, error);
  }

  return (
    <BlogPost
      initialContent={initialContent}
      initialLocale={locale}
    />
  );
}
