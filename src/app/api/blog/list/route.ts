import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicPostsList } from '@/server/content/service';
import { resolveContentLocale } from '@/utils/i18n/runtime';

/**
 * 博客文章列表 API
 *
 * 从本地 Markdown 或 PostgreSQL 数据源读取文章列表，
 * 并支持通过 offset/limit/locale 控制分页与语种。
 *
 * @param request Next.js 请求对象
 * @returns 文章列表响应
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');
  const localeParam = searchParams.get('locale');
  const locale = resolveContentLocale(localeParam);

  // NOTE: offset/limit 允许传入任意字符串，这里统一做 Number 转换与兜底。
  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;

  try {
    const data = await fetchPublicPostsList(offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    // NOTE: 仅在服务端输出具体错误，对客户端返回统一错误信息，避免泄露实现细节。
    console.error('API /api/blog/list error:', error);
    return NextResponse.json({ message: 'Failed to load posts' }, { status: 500 });
  }
}
