import { getDbClient } from "@/server/db/client";
import { extractVisitorIpFromHeaders, hashVisitorIp } from "@/server/analytics/visitor";

export interface AdminTopPostItem {
  id: string;
  slug: string;
  title: string;
  views: number;
  updatedAt: string;
}

export interface AdminVisitTrendItem {
  day: string;
  visits: number;
  uniqueVisitors: number;
}

export interface AdminTopPathItem {
  path: string;
  count: number;
}

export interface AdminDashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  recentVisits: number;
  recentUniqueVisitors: number;
  topPosts: AdminTopPostItem[];
  visitTrend: AdminVisitTrendItem[];
  topPaths: AdminTopPathItem[];
}

export interface AdminPostViewsPageItem {
  id: string;
  slug: string;
  title: string;
  views: number;
  updatedAt: string;
}

export interface AdminPathViewsPageItem {
  path: string;
  count: number;
}

export interface AdminPagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminPageQueryInput {
  page?: string;
  pageSize?: string;
}

const ADMIN_PAGE_SIZE_OPTIONS = new Set([10, 20, 50]);
const ADMIN_DEFAULT_PAGE_SIZE = 20;

/**
 * 判断当前 Prisma Client 是否支持 Post.status 字段
 *
 * @param db Prisma 客户端
 * @returns 是否支持 status 字段
 */
function supportsPostStatusField(db: Awaited<ReturnType<typeof getDbClient>>): boolean {
  const postFields = (db as { _runtimeDataModel?: { models?: { Post?: { fields?: Array<{ name?: unknown }> } } } })
    ._runtimeDataModel?.models?.Post?.fields;
  if (!Array.isArray(postFields)) {
    return false;
  }
  return postFields.some(field => field?.name === "status");
}

/**
 * 解析后台分页参数
 *
 * @param query 分页查询参数
 * @returns 标准化后的分页参数
 */
export function normalizeAdminPageQuery(query: AdminPageQueryInput): { page: number; pageSize: number } {
  const rawPage = Number.parseInt(query.page || "1", 10);
  const rawPageSize = Number.parseInt(query.pageSize || `${ADMIN_DEFAULT_PAGE_SIZE}`, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = ADMIN_PAGE_SIZE_OPTIONS.has(rawPageSize) ? rawPageSize : ADMIN_DEFAULT_PAGE_SIZE;
  return {
    page,
    pageSize,
  };
}

/**
 * 根据 slug 与语言读取文章主键
 *
 * @param slug 文章 slug
 * @param locale 文章语言
 * @returns 匹配到的文章主键，失败时返回空字符串
 */
async function resolvePostIdBySlug(slug: string, locale: string): Promise<string> {
  const db = await getDbClient();
  const queryLocale = locale === "zh-Hans" ? "zh-CN" : locale === "en-US" ? "en" : locale;
  const post = await db.post.findFirst({
    where: {
      slug,
      locale: queryLocale,
    },
    select: {
      id: true,
    },
  });
  return post?.id || "";
}

/**
 * 记录文章阅读事件并累积阅读量
 *
 * 该方法为“尽力写入”策略：任何写入失败均不抛出，避免影响主链路渲染。
 *
 * @param params 阅读追踪参数
 */
export async function trackPostView(params: {
  slug: string;
  locale: string;
  path: string;
  headers: Headers;
}): Promise<void> {
  const { slug, locale, path, headers } = params;
  if (!slug) {
    return;
  }

  try {
    const db = await getDbClient();
    const postId = await resolvePostIdBySlug(slug, locale);
    if (!postId) {
      return;
    }

    await db.post.update({
      where: { id: postId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    const visitorIp = extractVisitorIpFromHeaders(headers);
    const ipHash = hashVisitorIp(visitorIp);
    await db.visitorLog.create({
      data: {
        ipHash: ipHash || "unknown",
        path,
        userAgent: headers.get("user-agent"),
        referer: headers.get("referer"),
        locale,
      },
    });
  } catch (error) {
    console.warn("[analytics] trackPostView failed:", error);
  }
}

/**
 * 获取后台数据面板指标
 *
 * @param days 统计时间窗口（天）
 * @returns 后台展示所需指标集合
 */
export async function getAdminDashboardMetrics(days = 7): Promise<AdminDashboardMetrics> {
  const db = await getDbClient();
  const safeDays = Number.isFinite(days) ? Math.max(1, Math.min(30, Math.floor(days))) : 7;
  const now = new Date();
  const rangeStart = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);

  const hasStatusField = supportsPostStatusField(db);
  const publishedWhere = hasStatusField ? ({ status: "PUBLISHED" } as unknown as Record<string, unknown>) : {};

  const [totalPosts, totalViewsAggregate, topPostsRaw, recentVisits, topPathsRaw] = await Promise.all([
    db.post.count(),
    db.post.aggregate({
      _sum: {
        views: true,
      },
    }),
    db.post.findMany({
      where: publishedWhere as never,
      orderBy: [
        { views: "desc" },
        { updatedAt: "desc" },
      ],
      take: 8,
      select: {
        id: true,
        slug: true,
        title: true,
        views: true,
        updatedAt: true,
      },
    }),
    db.visitorLog.count({
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
    }),
    db.visitorLog.groupBy({
      by: ["path"],
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          path: "desc",
        },
      },
      take: 8,
    }),
  ]);

  const publishedPosts = hasStatusField
    ? await db.post.count({
        where: publishedWhere as never,
      })
    : totalPosts;

  const uniqueVisitorRows = await db.visitorLog.groupBy({
    by: ["ipHash"],
    where: {
      createdAt: {
        gte: rangeStart,
      },
    },
  });

  const visitTrendRaw = await db.$queryRaw<Array<{ day: Date; visits: bigint | number; unique_visitors: bigint | number }>>`
    SELECT
      DATE_TRUNC('day', "createdAt") AS day,
      COUNT(*)::bigint AS visits,
      COUNT(DISTINCT "ipHash")::bigint AS unique_visitors
    FROM "VisitorLog"
    WHERE "createdAt" >= ${rangeStart}
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY day ASC
  `;

  const topPosts: AdminTopPostItem[] = topPostsRaw.map((item: {
    id: string;
    slug: string;
    title: string;
    views: number;
    updatedAt: Date;
  }) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    views: item.views,
    updatedAt: item.updatedAt.toISOString(),
  }));

  const visitTrend: AdminVisitTrendItem[] = visitTrendRaw.map((item: {
    day: Date;
    visits: bigint | number;
    unique_visitors: bigint | number;
  }) => ({
    day: item.day.toISOString().slice(0, 10),
    visits: Number(item.visits),
    uniqueVisitors: Number(item.unique_visitors),
  }));

  const topPaths: AdminTopPathItem[] = topPathsRaw.map((item: {
    path: string;
    _count: { _all: number };
  }) => ({
    path: item.path,
    count: item._count._all,
  }));

  return {
    totalPosts,
    publishedPosts,
    totalViews: totalViewsAggregate._sum.views || 0,
    recentVisits,
    recentUniqueVisitors: uniqueVisitorRows.length,
    topPosts,
    visitTrend,
    topPaths,
  };
}

/**
 * 获取文章阅读量分页数据
 *
 * @param params 分页参数
 * @returns 文章阅读量分页结果
 */
export async function getAdminPostViewsPage(params: {
  page: number;
  pageSize: number;
}): Promise<AdminPagedResult<AdminPostViewsPageItem>> {
  const db = await getDbClient();
  const safePage = Math.max(1, Math.floor(params.page));
  const safePageSize = ADMIN_PAGE_SIZE_OPTIONS.has(params.pageSize) ? params.pageSize : ADMIN_DEFAULT_PAGE_SIZE;
  const total = await db.post.count();
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);
  const page = Math.min(safePage, totalPages);
  const skip = (page - 1) * safePageSize;

  const rows = await db.post.findMany({
    orderBy: [
      { views: "desc" },
      { updatedAt: "desc" },
    ],
    skip,
    take: safePageSize,
    select: {
      id: true,
      slug: true,
      title: true,
      views: true,
      updatedAt: true,
    },
  });

  return {
    items: rows.map((item: {
      id: string;
      slug: string;
      title: string;
      views: number;
      updatedAt: Date;
    }) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      views: item.views,
      updatedAt: item.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize: safePageSize,
    totalPages,
  };
}

/**
 * 获取访问路径分页数据
 *
 * @param params 分页参数
 * @returns 访问路径分页结果
 */
export async function getAdminPathViewsPage(params: {
  page: number;
  pageSize: number;
}): Promise<AdminPagedResult<AdminPathViewsPageItem>> {
  const db = await getDbClient();
  const safePage = Math.max(1, Math.floor(params.page));
  const safePageSize = ADMIN_PAGE_SIZE_OPTIONS.has(params.pageSize) ? params.pageSize : ADMIN_DEFAULT_PAGE_SIZE;

  const totalRows = await db.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::bigint AS count
    FROM (
      SELECT "path"
      FROM "VisitorLog"
      GROUP BY "path"
    ) AS grouped_paths
  `;

  const total = Number(totalRows[0]?.count || 0);
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);
  const page = Math.min(safePage, totalPages);
  const offset = (page - 1) * safePageSize;

  const rows = await db.$queryRaw<Array<{ path: string; count: bigint | number }>>`
    SELECT "path", COUNT(*)::bigint AS count
    FROM "VisitorLog"
    GROUP BY "path"
    ORDER BY COUNT(*) DESC, "path" ASC
    LIMIT ${safePageSize}
    OFFSET ${offset}
  `;

  return {
    items: rows.map((item) => ({
      path: item.path,
      count: Number(item.count),
    })),
    total,
    page,
    pageSize: safePageSize,
    totalPages,
  };
}
