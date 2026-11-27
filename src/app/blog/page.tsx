import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import Blog from '@/components/Blog/Blog';
import { getLocalPostsList } from '@/utils/content/local';
import { blogPagePath, pageMetadata } from '@/utils/seo';

type BlogPageProps = { searchParams: Promise<{ page?: string | string[] }> };
const itemsLimit = Math.max(1, Number.parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10);

const getPage = cache(async (value?: string | string[]) => {
    if (value !== undefined && (typeof value !== 'string' || !/^\d+$/.test(value))) notFound();
    const number = value === undefined ? 1 : Number(value);
    if (!Number.isSafeInteger(number) || number < 1) notFound();
    const posts = await getLocalPostsList((number - 1) * itemsLimit, itemsLimit, 'zh-CN');
    if (number > Math.max(1, Math.ceil(posts.total / itemsLimit))) notFound();
    if (value !== undefined && (number === 1 || value !== String(number))) permanentRedirect(blogPagePath(number));
    return { number, posts };
});

export async function generateMetadata({ searchParams }: BlogPageProps) {
    const { number } = await getPage((await searchParams).page);
    const title = number === 1 ? '技术博客' : `技术博客 · 第 ${number} 页`;
    return pageMetadata(blogPagePath(number), title, `浏览 WaveYo 的 Go 后端、网关、数据库与部署实战文章${number === 1 ? '' : `（第 ${number} 页）`}。`);
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const { number, posts } = await getPage((await searchParams).page);
    return <Blog key={number} currentPage={number} itemsLimit={itemsLimit} initialPosts={posts.items} initialTotal={posts.total} initialLocale="zh-CN" />;
}
