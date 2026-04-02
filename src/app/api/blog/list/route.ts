import { NextRequest, NextResponse } from 'next/server';
import { getLocalPostsList } from '@/utils/content/local';
import { getDbPostsList } from '@/utils/content/db';

/**
 * 判断当前是否启用数据库作为博客内容数据源
 *
 * @returns 是否启用数据库内容数据源
 */
function shouldUseDatabaseContent(): boolean {
  return process.env.NEXT_PUBLIC_USE_DB_CONTENT === 'true';
}

/**
 * 博客文章列表 API
 *
 * 从本地 Markdown 文件或 PostgreSQL 数据库中读取文章元数据并做分页处理，
 * 通过 offset/limit/locale 控制分页游标与语言版本，
 * 用于替代远程 CMS / Server Actions 的列表查询。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');
  const localeParam = searchParams.get('locale');

  // NOTE: offset/limit 允许传入任意字符串，这里统一做 Number 转换与兜底
  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || '10', 10) || 10;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;
  // NOTE: 未指定语言时默认使用英文内容，保持与本地内容约定一致
  const locale = localeParam || 'en';

  try {
    const useDb = shouldUseDatabaseContent();
    const data = useDb ? await getDbPostsList(offset, limit, locale) : await getLocalPostsList(offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    // NOTE: 仅在服务端输出具体错误，对客户端返回统一错误信息，避免泄露实现细节
    console.error('API /api/blog/list error:', error);
    return NextResponse.json({ message: 'Failed to load posts' }, { status: 500 });
  }
}
