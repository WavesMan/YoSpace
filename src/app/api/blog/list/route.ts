import { NextRequest, NextResponse } from 'next/server';
import { getLocalPostsList } from '@/utils/content/local';

/**
 * 博客文章列表 API
 *
 * 从本地 Markdown 文件系统读取文章元数据并做分页处理，
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
    // NOTE: 调用本地内容读取工具，按语言与分页返回文章列表
    const data = await getLocalPostsList(offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    // NOTE: 仅在服务端输出具体错误，对客户端返回统一错误信息，避免泄露实现细节
    console.error('API /api/blog/list error:', error);
    return NextResponse.json({ message: 'Failed to load posts' }, { status: 500 });
  }
}
