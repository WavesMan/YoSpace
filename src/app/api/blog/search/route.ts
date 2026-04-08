import { NextRequest, NextResponse } from "next/server";
import { searchPublicPosts } from "@/server/content/service";
import { getServerRuntimePublicConfig } from "@/server/runtime-config/public";
import { resolveContentLocale } from "@/utils/i18n/runtime";

/**
 * 博客搜索 API。
 * 对外提供关键字搜索能力，并统一分页与语言处理。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const runtimeConfig = await getServerRuntimePublicConfig();

  const keywordParam = searchParams.get("query") || "";
  const offsetParam = searchParams.get("offset");
  const limitParam = searchParams.get("limit");
  const localeParam = searchParams.get("locale");
  const locale = resolveContentLocale(localeParam, runtimeConfig);

  const offset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
  const defaultLimit = runtimeConfig.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE;
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
    console.error("API /api/blog/search error:", error);
    return NextResponse.json({ message: "Failed to search posts" }, { status: 500 });
  }
}
