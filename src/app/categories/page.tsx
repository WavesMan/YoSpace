import { pageMetadata } from "@/utils/seo";
import { getInitialPosts } from '@/utils/content/initialPosts';
import CategoriesPage from "@/components/Blog/CategoriesPage";

export const metadata = pageMetadata("/categories", "文章分类", "按主题浏览 WaveYo 的后端架构、数据库与部署文章。");

export const revalidate = 3600;

export default async function CategoriesRoutePage() {
    const initial = await getInitialPosts();
    return <CategoriesPage {...initial} />;
}

