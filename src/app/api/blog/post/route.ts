import { NextRequest, NextResponse } from 'next/server';
import { getLocalPostContent } from '@/utils/content/local';
import { getDbPostContent } from '@/utils/content/db';

/**
 * 判断当前是否启用数据库作为博客内容数据源
 *
 * @returns 是否启用数据库内容数据源
 */
function shouldUseDatabaseContent(): boolean {
  return process.env.NEXT_PUBLIC_USE_DB_CONTENT === 'true';
}

/**
 * 博客文章详情 API
 *
 * 根据 slug 与语言从本地 Markdown 文件或 PostgreSQL 数据库中读取文章内容，
 * 用于博客详情页的数据源，替代远程 CMS / Server Actions。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const slug = searchParams.get('slug');
  const localeParam = searchParams.get('locale');
  // NOTE: 未指定语言时默认使用英文内容，保持与本地内容约定一致
  const locale = localeParam || 'en';

  if (!slug) {
    // NOTE: 缺少 slug 属于客户端请求错误，返回 400
    return NextResponse.json({ message: 'Missing slug' }, { status: 400 });
  }

  try {
    const useDb = shouldUseDatabaseContent();
    const data = useDb ? await getDbPostContent(slug, locale) : await getLocalPostContent(slug, locale);
    return NextResponse.json(data);
  } catch (error) {
    // NOTE: 未找到文章或解析失败时统一返回 404，避免暴露具体失败原因
    console.error(`API /api/blog/post error for slug ${slug}:`, error);
    return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  }
}
