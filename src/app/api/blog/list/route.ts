import { NextRequest, NextResponse } from "next/server";
import { fetchPublicPostsList } from "@/server/content/service";
import { resolveContentLocale } from "@/utils/i18n/runtime";

/**
 * 博客文章列表 API
 *
 * 支持通过 offset、limit、locale 查询文章列表数据。
 *
 * @param request Next.js 请求对象
 * @returns 文章列表响应
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const offsetParam = searchParams.get("offset");
  const limitParam = searchParams.get("limit");
  const localeParam = searchParams.get("locale");
  const locale = resolveContentLocale(localeParam);

  /**
   * 统一处理分页参数，避免异常输入导致 API 报错。
   */
  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = parseInt(process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || "10", 10) || 10;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;

  try {
    const data = await fetchPublicPostsList(offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/blog/list error:", error);
    return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
  }
}
