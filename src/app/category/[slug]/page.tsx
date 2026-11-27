import { cache } from 'react';
import { notFound } from 'next/navigation';
import CategoryDetail from '@/components/Blog/CategoryDetail';
import { getLocalPostsList } from '@/utils/content/local';
import { pageMetadata } from '@/utils/seo';

type TaxonomyParams = { params: Promise<{ slug: string }> };

const getPosts = cache(async (slug: string) => {
    const { items } = await getLocalPostsList(0, Number.MAX_SAFE_INTEGER, 'zh-CN');
    const posts = items.filter(item => item.category?.id === slug);
    if (!posts.length) notFound();
    return posts;
});

export async function generateMetadata({ params }: TaxonomyParams) {
    const slug = decodeURIComponent((await params).slug);
    const posts = await getPosts(slug);
    const label = posts[0].category?.labelZh || slug;
    return {
        ...pageMetadata('/category/' + encodeURIComponent(slug), label + ' · 分类', '浏览 WaveYo 关于' + label + '的技术文章。'),
    };
}

export default async function TaxonomyPage({ params }: TaxonomyParams) {
    const slug = decodeURIComponent((await params).slug);
    const posts = await getPosts(slug);
    return <CategoryDetail slug={slug} initialPosts={posts} initialLocale="zh-CN" />;
}
