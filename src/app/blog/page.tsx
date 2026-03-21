import Blog from '@/components/Blog/Blog';
import { Metadata } from 'next';
import { getLocalPostsList } from '@/utils/content/local';
import { cookies, headers } from 'next/headers';

// 博客页面
export const metadata: Metadata = {
  title: `Blog - ${process.env.NEXT_PUBLIC_SITE_TITLE || 'YoSpace'}`,
  description: 'My thoughts and writings',
};

// ISR: Revalidate every hour
export const revalidate = 3600;

/**
 *
 * BlogPage 页面
 *
 * 首屏根据 cookie 与请求头推断语言，直接返回对应语言的文章列表。
 *
 * @returns 博客列表页面
 *
 */
export default async function BlogPage() {
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
  const itemsLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10') || 10;
  let initialData;
  
  try {
      initialData = await getLocalPostsList(0, itemsLimit, locale);
  } catch (e) {
      console.error("Failed to fetch initial blog posts", e);
  }

  // 渲染博客组件
  return (
    <Blog 
        initialPosts={initialData?.items} 
        initialTotal={initialData?.total} 
        initialLocale={locale} 
    />
  );
}
