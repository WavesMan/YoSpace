import { Metadata } from "next";
import TagDetail from "@/components/Blog/TagDetail";
import { getLocalPostsList, type PostItem } from "@/utils/content/local";
import { cookies, headers } from "next/headers";

export const metadata: Metadata = {
    title: `Tag - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface TagPageParams {
    slug: string;
}

/**
 *
 * TagPage 页面
 *
 * 首屏根据 cookie 与请求头推断语言，直出标签文章列表。
 *
 * @param params 动态路由参数
 * @returns 标签详情页
 *
 */
export default async function TagPage({ params }: { params: Promise<TagPageParams> }) {
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
    let initialPosts: PostItem[];
    try {
        const list = await getLocalPostsList(0, 2000, locale);
        initialPosts = list.items;
    } catch {
        initialPosts = [];
    }
    return <TagDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
