import type { PostContentResponse, PostListResponse } from "@/utils/content/local";
import { getAllLocalPostSlugs, getLocalPostContent, getLocalPostsList } from "@/utils/content/local";
import { getAllDbPostSlugs, getDbPostContent, getDbPostsList, searchDbPosts } from "@/utils/content/db";
import { getDbClient } from "@/server/db/client";
import { getRuntimeConfigValue } from "@/server/runtime-config/service";
import { resolveContentLocale } from "@/utils/i18n/runtime";

interface PublicPostContentResult {
  content: PostContentResponse;
  resolvedSlug: string;
}

/**
 * 判断当前是否启用数据库内容源
 *
 * 统一收口内容源切换逻辑，避免在页面、API 与组件中重复散落判断分支。
 *
 * @returns 是否启用 PostgreSQL 作为博客内容源
 */
/**
 * 判断当前是否启用数据库内容源。
 * 该开关来自 Runtime Config，避免前台链路直接读取环境变量。
 * @returns 是否启用 PostgreSQL 作为博客内容源
 */
export async function shouldUseDatabaseContent(): Promise<boolean> {
  const value = await getRuntimeConfigValue("NEXT_PUBLIC_USE_DB_CONTENT");
  return value === true;
}

/**
 * 归一化详情查询中的语言标识
 *
 * 说明：
 * - en-US -> en
 * - zh-Hans -> zh-CN
 * - 其他值原样返回
 *
 * @param rawLocale 原始语言标识
 * @returns 归一化后的语言标识
 */
function normalizeDetailLocale(rawLocale: string): string {
  return resolveContentLocale(rawLocale);
}

/**
 * 从数据库中解析 slug 重定向结果
 *
 * 仅在启用数据库内容源时使用。若存在旧 slug 到新 slug 的映射关系，
 * 返回重定向后的 slug；否则返回原始 slug。
 *
 * @param slug 请求中的文章 slug
 * @param locale 语言标识
 * @returns 解析后的 slug
 */
async function resolveDbSlug(slug: string, locale: string): Promise<string> {
  const db = await getDbClient();
  const normalizedLocale = normalizeDetailLocale(locale);
  const redirectDelegate = (db as unknown as {
    postSlugRedirect?: {
      findUnique?: (args: {
        where: { oldSlug_locale: { oldSlug: string; locale: string } };
        select: { newSlug: true };
      }) => Promise<{ newSlug?: string } | null>;
    };
  }).postSlugRedirect;
  if (!redirectDelegate || typeof redirectDelegate.findUnique !== "function") {
    return slug;
  }

  try {
    const redirectRecord = await redirectDelegate.findUnique({
      where: {
        oldSlug_locale: {
          oldSlug: slug,
          locale: normalizedLocale,
        },
      },
      select: {
        newSlug: true,
      },
    });
    if (!redirectRecord || typeof redirectRecord.newSlug !== "string") {
      return slug;
    }
    return redirectRecord.newSlug;
  } catch (error) {
    console.warn("[content] postSlugRedirect unavailable, fallback to original slug:", error);
    return slug;
  }
}

/**
 * 获取公开文章列表
 *
 * @param offset 分页偏移量（从 0 开始）
 * @param limit 每页条目数
 * @param locale 语言标识
 * @returns 列表响应结构
 */
export async function fetchPublicPostsList(offset: number, limit: number, locale: string): Promise<PostListResponse> {
  const resolvedLocale = resolveContentLocale(locale);
  if (await shouldUseDatabaseContent()) {
    return getDbPostsList(offset, limit, resolvedLocale);
  }
  return getLocalPostsList(offset, limit, resolvedLocale);
}

/**
 * 获取公开文章详情，并在数据库模式下处理 slug 重定向
 *
 * @param slug 请求中的文章 slug
 * @param locale 语言标识
 * @returns 文章内容与最终解析的 slug
 */
export async function fetchPublicPostContentBySlug(slug: string, locale: string): Promise<PublicPostContentResult> {
  const resolvedLocale = resolveContentLocale(locale);
  if (!(await shouldUseDatabaseContent())) {
    const content = await getLocalPostContent(slug, resolvedLocale);
    return {
      content,
      resolvedSlug: slug,
    };
  }

  const resolvedSlug = await resolveDbSlug(slug, resolvedLocale);
  const content = await getDbPostContent(resolvedSlug, resolvedLocale);
  return {
    content,
    resolvedSlug,
  };
}

/**
 * 获取公开可访问文章的 slug 列表
 *
 * @returns slug 列表
 */
export async function fetchPublicPostSlugs(): Promise<{ slug: string }[]> {
  if (await shouldUseDatabaseContent()) {
    return getAllDbPostSlugs();
  }
  return getAllLocalPostSlugs();
}

/**
 * 搜索公开文章
 *
 * @param keyword 关键字
 * @param offset 分页偏移量（从 0 开始）
 * @param limit 每页条目数
 * @param locale 语言标识
 * @returns 列表响应结构
 */
export async function searchPublicPosts(
  keyword: string,
  offset: number,
  limit: number,
  locale: string,
): Promise<PostListResponse> {
  const resolvedLocale = resolveContentLocale(locale);
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      items: [],
      total: 0,
      locale: resolvedLocale,
    };
  }

  if (await shouldUseDatabaseContent()) {
    return searchDbPosts(trimmed, offset, limit, resolvedLocale);
  }

  const queryLocale = resolvedLocale === "zh-CN" ? "zh-CN" : "en";
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeOffset = Math.max(0, Math.floor(offset));
  const fetchLimit = Math.min(Math.max(100, safeLimit * 8), 5000);
  const listData = await getLocalPostsList(0, fetchLimit, queryLocale);
  const keywordLower = trimmed.toLowerCase();
  const filtered = listData.items.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const description = (item.description || "").toLowerCase();
    const tagsText = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";
    return title.includes(keywordLower) || description.includes(keywordLower) || tagsText.includes(keywordLower);
  });
  const paged = filtered.slice(safeOffset, safeOffset + safeLimit);

  return {
    items: paged,
    total: filtered.length,
    locale: resolvedLocale === "zh-CN" ? "zh-CN" : "en",
  };
}
