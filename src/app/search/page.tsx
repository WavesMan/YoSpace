import { pageMetadata } from "@/utils/seo";
import { getInitialPosts } from '@/utils/content/initialPosts';
import SearchPage from "@/components/Blog/SearchPage";

export const metadata = { ...pageMetadata("/search", "站内搜索", "搜索 WaveYo 技术博客中的文章。"), robots: { index: false, follow: true } };

export const revalidate = 3600;

export default async function SearchRoutePage() {
    const initial = await getInitialPosts();
    return <SearchPage {...initial} />;
}

