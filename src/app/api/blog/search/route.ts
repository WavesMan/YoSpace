import { NextRequest, NextResponse } from 'next/server';
import { searchPublicPosts } from '@/server/content/service';
import { resolveContentLocale } from '@/utils/i18n/runtime';

/**
 * 博客搜索 API
 *
 * 统一对外提供基于关键字的文章搜索能力：
 * - 当启用数据库内容数据源时，使用 PostgreSQL 执行模糊搜索
 * - 否则回退到本地 Markdown 文章的内存过滤逻辑
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const keywordParam = searchParams.get('query') || '';
  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');
  const localeParam = searchParams.get('locale');
  const locale = resolveContentLocale(localeParam);

  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;

  if (!keywordParam.trim()) {
    return NextResponse.json({
      items: [],
      total: 0,
      locale,
    });
  }

  try {
    const data = await searchPublicPosts(keywordParam, offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API /api/blog/search error:', error);
    return NextResponse.json({ message: 'Failed to search posts' }, { status: 500 });
  }
}
