import { pageMetadata } from "@/utils/seo";
import { getLocalPostsList } from '@/utils/content/local';
import Archive from "@/components/Blog/Archive";

export const metadata = pageMetadata("/archive", "文章归档", "按年月浏览 WaveYo 发布的技术文章。");

export const revalidate = 3600;

export default async function ArchivePage() {
    const { items } = await getLocalPostsList(0, Number.MAX_SAFE_INTEGER, 'zh-CN');
    return <Archive initialPosts={items} initialLocale="zh-CN" />;
}

