import BlogPost from '@/components/Blog/BlogPost';
import { Metadata } from 'next';
import { getLocalPostContent, getAllLocalPostSlugs } from '@/utils/content/local';

export const metadata: Metadata = {
  title: `Blog Post - ${process.env.NEXT_PUBLIC_SITE_TITLE || 'YoSpace'}`,
};

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

    return (
        <BlogPost 
            initialContent={initialContent} 
            initialLocale={locale} 
        />
    );
}
