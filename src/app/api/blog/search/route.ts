import { NextRequest, NextResponse } from 'next/server';
import { getLocalPostsList } from '@/utils/content/local';
import { searchDbPosts } from '@/utils/content/db';

/**
 * 判断当前是否启用数据库作为博客内容数据源
 *
 * @returns 是否启用数据库内容数据源
 */
function shouldUseDatabaseContent(): boolean {
  return process.env.NEXT_PUBLIC_USE_DB_CONTENT === 'true';
}

/**
 * 对本地文章列表执行简单关键字搜索
 *
 * 当未启用数据库内容源时，回退到本地 Markdown 文章列表的内存过滤，
 * 按标题、描述与标签文本进行大小写不敏感匹配，用于兼容旧搜索体验。
 *
 * @param keyword 搜索关键字
 * @param locale 目标语言标识
 * @returns 匹配的文章列表与总数
 */
async function searchLocalPosts(keyword: string, locale: string) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      items: [],
      total: 0,
      locale,
    };
  }
  const normalizedKeyword = trimmed.toLowerCase();

  // NOTE: 为避免一次性拉取所有文章造成不必要开销，这里在列表基础上做简单分页限制
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10;
  const maxLimit = defaultLimit * 10;
  const queryLocale = locale === 'zh-CN' ? 'zh-CN' : 'en';
  const listData = await getLocalPostsList(0, maxLimit, queryLocale);

  const filtered = listData.items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const tagsText = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
    if (title.includes(normalizedKeyword)) return true;
    if (description.includes(normalizedKeyword)) return true;
    if (tagsText.includes(normalizedKeyword)) return true;
    return false;
  });

  return {
    items: filtered,
    total: filtered.length,
    locale: listData.locale,
  };
}

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
  const localeParam = searchParams.get('locale') || 'en';

  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;

  if (!keywordParam.trim()) {
    return NextResponse.json({
      items: [],
      total: 0,
      locale: localeParam,
    });
  }

  try {
    const useDb = shouldUseDatabaseContent();
    if (useDb) {
      const data = await searchDbPosts(keywordParam, offset, limit, localeParam);
      return NextResponse.json(data);
    }

    const localData = await searchLocalPosts(keywordParam, localeParam);
    return NextResponse.json(localData);
  } catch (error) {
    console.error('API /api/blog/search error:', error);
    return NextResponse.json({ message: 'Failed to search posts' }, { status: 500 });
  }
}

