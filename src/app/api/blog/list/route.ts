import { NextRequest, NextResponse } from "next/server";
import { fetchPublicPostsList } from "@/server/content/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale } from "@/utils/i18n/runtime";

/**
 * 博客文章列表 API。
 * 支持通过 offset、limit、locale 查询文章列表。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const runtimeConfig = await getServerRuntimePublicConfig();

  const offsetParam = searchParams.get("offset");
  const limitParam = searchParams.get("limit");
  const localeParam = searchParams.get("locale");
  const locale = resolveContentLocale(localeParam, runtimeConfig);

  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = runtimeConfig.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE;
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : defaultLimit;

  try {
    const data = await fetchPublicPostsList(offset, limit, locale);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/blog/list error:", error);
    return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
  }
}
