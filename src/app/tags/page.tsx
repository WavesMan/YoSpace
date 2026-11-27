import { pageMetadata } from "@/utils/seo";
import { getInitialPosts } from '@/utils/content/initialPosts';
import TagsPage from "@/components/Blog/TagsPage";

export const metadata = pageMetadata("/tags", "文章标签", "按技术标签查找 WaveYo 的实践文章。");

export const revalidate = 3600;

export default async function TagsRoutePage() {
    const initial = await getInitialPosts();
    return <TagsPage {...initial} />;
}

