import { Metadata } from "next";
import CategoryDetail from "@/components/Blog/CategoryDetail";
import { getLocalPostsList, type PostItem } from "@/utils/content/local";

export const metadata: Metadata = {
    title: `Category - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface CategoryPageParams {
    slug: string;
}

export default async function CategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
    const { slug } = await params;
    const locale = "en";
    let initialPosts: PostItem[];
    try {
        const list = await getLocalPostsList(0, 2000, locale);
        initialPosts = list.items;
    } catch {
        initialPosts = [];
    }
    return <CategoryDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
