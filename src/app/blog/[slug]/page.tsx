import BlogPost from '@/components/Blog/BlogPost';
import { Metadata } from 'next';
import { getLocalPostContent, getAllLocalPostSlugs } from '@/utils/content/local';
import { buildUrl, seoConfig } from '@/utils/seo';

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const locale = 'en';
    const canonical = buildUrl(`/blog/${encodeURIComponent(slug)}`);
    const ogImages = seoConfig.defaultOgImage ? [buildUrl(seoConfig.defaultOgImage)] : undefined;

    try {
        const post = await getLocalPostContent(slug, locale);
        const title = `${post.title} - ${seoConfig.siteName}`;
        const description = post.description || seoConfig.defaultDescription;
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
        const description = seoConfig.defaultDescription;
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
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // 默认预渲染英文内容
    const locale = 'en';
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
