import BlogPost from '@/components/Blog/BlogPost';
import { Metadata } from 'next';
import { getLocalPostContent, getAllLocalPostSlugs } from '@/utils/content/local';
import { buildUrl, seoConfig } from '@/utils/seo';
import { cookies, headers } from 'next/headers';

// ISR: 每小时重新验证一次
export const revalidate = 3600;

// 预生成所有文章路径 (SSG)
export async function generateStaticParams() {
    try {
        const slugs = await getAllLocalPostSlugs();
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
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get('locale')?.value;
    const requestHeaders = await headers();
    const acceptLang = requestHeaders.get('accept-language')?.toLowerCase() || '';
    const uiLocale = savedLocale === 'en-US' || savedLocale === 'zh-CN'
        ? savedLocale
        : acceptLang.startsWith('en')
            ? 'en-US'
            : 'zh-CN';
    const locale = uiLocale === 'en-US' ? 'en' : 'zh-CN';
    const canonical = buildUrl(`/blog/${encodeURIComponent(slug)}`);
    const ogImages = seoConfig.defaultOgImage ? [buildUrl(seoConfig.defaultOgImage)] : undefined;

    try {
        const post = await getLocalPostContent(slug, locale);
        const title = `${post.title} - ${seoConfig.siteName}`;
        const descRaw = post.description || seoConfig.defaultDescription;
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
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get('locale')?.value;
    const requestHeaders = await headers();
    const acceptLang = requestHeaders.get('accept-language')?.toLowerCase() || '';
    const uiLocale = savedLocale === 'en-US' || savedLocale === 'zh-CN'
        ? savedLocale
        : acceptLang.startsWith('en')
            ? 'en-US'
            : 'zh-CN';
    const locale = uiLocale === 'en-US' ? 'en' : 'zh-CN';
    let initialContent;
    
    try {
        initialContent = await getLocalPostContent(slug, locale);
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
