import Blog from '@/components/Blog/Blog';
import { Metadata } from 'next';
import { getLocalPostsList } from '@/utils/content/local';

export const metadata: Metadata = {
  title: `Blog - ${process.env.NEXT_PUBLIC_SITE_TITLE || 'YoSpace'}`,
  description: 'My thoughts and writings',
};

// ISR: Revalidate every hour
export const revalidate = 3600;

export default async function BlogPage() {
  // 服务端预渲染默认获取英文内容
  // 客户端如果检测到是中文，会自动重新获取
  const locale = 'en'; 
  const itemsLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10') || 10;
  let initialData;
  
  try {
      initialData = await getLocalPostsList(0, itemsLimit, locale);
  } catch (e) {
      console.error("Failed to fetch initial blog posts", e);
  }

  return (
    <Blog 
        initialPosts={initialData?.items} 
        initialTotal={initialData?.total} 
        initialLocale={locale} 
    />
  );
}
