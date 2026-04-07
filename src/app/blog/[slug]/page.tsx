import BlogPost from "@/components/Blog/BlogPost";
import { Metadata } from "next";
import { buildUrl, seoConfig } from "@/utils/seo";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchPublicPostContentBySlug, fetchPublicPostSlugs } from "@/server/content/service";
import { trackPostView } from "@/server/analytics/service";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";

const __blogRevalidate = 3600;
void __blogRevalidate;

// ISR: 每小时重新验证一次
export const revalidate = 3600;

/**
 * 判断当前是否启用数据库作为博客内容数据源
 *
 * 通过环境变量 NEXT_PUBLIC_USE_DB_CONTENT 控制博客详情页的内容来源，
 * 在保持本地 Markdown 回退能力的同时，优先支持 PostgreSQL 作为主数据源。
 *
 * @returns 是否启用数据库内容数据源
 */
async function resolveBlogLocale(): Promise<string> {
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get('locale')?.value;
    const requestHeaders = await headers();
    const acceptLang = requestHeaders.get('accept-language')?.toLowerCase() || '';
    const i18nConfig = resolveI18nRuntimeConfig();
    if (!i18nConfig.enabled) {
        return resolveContentLocale(null);
    }
    const uiLocale = savedLocale === 'en-US' || savedLocale === 'zh-CN'
        ? savedLocale
        : acceptLang.startsWith('en')
            ? 'en-US'
            : 'zh-CN';
    return resolveContentLocale(uiLocale);
}

// 预生成所有文章路径 (SSG)
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
 *
 * 生成文章详情页 SEO 元信息
 *
 * 根据 cookie 与请求头推断语言，优先返回对应语言的标题与摘要。
 *
 * @param params 动态路由参数
 * @returns 页面元信息
 *
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const locale = await resolveBlogLocale();
    const ogImages = seoConfig.defaultOgImage ? [buildUrl(seoConfig.defaultOgImage)] : undefined;

    try {
        const result = await fetchPublicPostContentBySlug(slug, locale);
        const canonical = buildUrl(`/blog/${encodeURIComponent(result.resolvedSlug)}`);
        const title = `${result.content.title} - ${seoConfig.siteName}`;
        const descRaw = result.content.description || seoConfig.defaultDescription;
        const description = descRaw.replace(/\s+/g, ' ').trim().slice(0, 180);
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
        const canonical = buildUrl(`/blog/${encodeURIComponent(slug)}`);
        const title = `${seoConfig.defaultTitle} - ${seoConfig.siteName}`;
        const description = seoConfig.defaultDescription.replace(/\s+/g, ' ').trim().slice(0, 180);
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

// 博客文章页面
/**
 *
 * BlogPostPage 页面
 *
 * 首屏根据 cookie 与请求头推断语言，直出对应语言的文章内容。
 *
 * @param params 动态路由参数
 * @returns 博客文章详情页
 *
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
    } catch (e) {
        console.error(`Failed to fetch content for slug: ${slug}`, e);
        // 如果服务端获取失败，不中断渲染，让客户端尝试或显示错误
    }

    // 渲染博客文章组件
    return (
        <BlogPost 
            initialContent={initialContent} 
            initialLocale={locale} 
        />
    );
}
