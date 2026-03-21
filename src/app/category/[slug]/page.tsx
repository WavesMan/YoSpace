import { Metadata } from "next";
import CategoryDetail from "@/components/Blog/CategoryDetail";
import { getLocalPostsList, type PostItem } from "@/utils/content/local";
import { cookies, headers } from "next/headers";

export const metadata: Metadata = {
    title: `Category - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface CategoryPageParams {
    slug: string;
}

/**
 *
 * CategoryPage 页面
 *
 * 首屏根据 cookie 与请求头推断语言，直出分类文章列表。
 *
 * @param params 动态路由参数
 * @returns 分类详情页
 *
 */
export default async function CategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
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
    return <CategoryDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
