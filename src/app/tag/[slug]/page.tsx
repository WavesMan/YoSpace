import { Metadata } from "next";
import TagDetail from "@/components/Blog/TagDetail";
import { getLocalPostsList, type PostItem } from "@/utils/content/local";

export const metadata: Metadata = {
    title: `Tag - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
};

export const revalidate = 3600;

interface TagPageParams {
    slug: string;
}

export default async function TagPage({ params }: { params: Promise<TagPageParams> }) {
    const { slug } = await params;
    const locale = "en";
    let initialPosts: PostItem[];
    try {
        const list = await getLocalPostsList(0, 2000, locale);
        initialPosts = list.items;
    } catch {
        initialPosts = [];
    }
    return <TagDetail slug={slug} initialPosts={initialPosts} initialLocale={locale} />;
}
