import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import BlogPost from '@/components/Blog/BlogPost';
import RelatedPosts from '@/components/Blog/Post/RelatedPosts';
import { getAllLocalPostSlugs, getLocalPostContent, PostNotFoundError } from '@/utils/content/local';
import { buildUrl, pageMetadata, seoConfig, serializeJsonLd, toSeoDate } from '@/utils/seo';

const getPost = cache(async (slug: string) => {
    try {
        return await getLocalPostContent(slug, 'zh-CN');
    } catch (error) {
        if (error instanceof PostNotFoundError) notFound();
        throw error;
    }
});

const postPath = (slug: string) => `/blog/${encodeURIComponent(slug)}`;
type ArticleParams = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
    return getAllLocalPostSlugs();
}

export async function generateMetadata({ params }: ArticleParams): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);
    const description = post.description?.trim().replace(/\s+/g, ' ') || seoConfig.defaultDescription;
    const metadata = pageMetadata(postPath(slug), post.title, description);
    const image = buildUrl(post.image || seoConfig.defaultOgImage);

    return {
        ...metadata,
        openGraph: {
            ...metadata.openGraph,
            type: 'article',
            locale: post.locale === 'en' ? 'en_US' : 'zh_CN',
            publishedTime: toSeoDate(post.publishedTime),
            modifiedTime: toSeoDate(post.updatedTime),
            authors: [post.author || seoConfig.siteName],
            tags: post.tags,
            images: [image],
        },
        twitter: { ...metadata.twitter, card: 'summary_large_image', images: [image] },
    };
}

export default async function BlogPostPage({ params }: ArticleParams) {
    const { slug } = await params;
    const post = await getPost(slug);
    const url = buildUrl(postPath(slug));
    const author = post.author || seoConfig.siteName;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [{
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description || undefined,
            mainEntityOfPage: url,
            url,
            inLanguage: post.locale,
            datePublished: toSeoDate(post.publishedTime),
            dateModified: toSeoDate(post.updatedTime),
            image: post.image ? buildUrl(post.image) : undefined,
            author: {
                '@type': 'Person',
                name: author,
                ...(author === seoConfig.siteName && { url: buildUrl('/') }),
            },
        }, {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: '技术博客', item: buildUrl('/blog') },
                { '@type': 'ListItem', position: 2, name: post.title, item: url },
            ],
        }],
    };
    const relatedEnabled = process.env.NEXT_PUBLIC_BLOG_SERIES_ENABLED !== 'false' || process.env.NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED !== 'false';
    const locale = post.locale || 'zh-CN';

    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
        <BlogPost
            key={slug}
            initialContent={post}
            initialLocale="zh-CN"
            relatedSlot={relatedEnabled ? (
                <Suspense fallback={null}>
                    <RelatedPosts slug={slug} locale={locale} seriesId={post.series?.id} />
                </Suspense>
            ) : undefined}
        />
    </>;
}
