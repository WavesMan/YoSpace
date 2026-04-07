import { getDbClient } from "@/server/db/client";
import { resolveContentLocale, resolveI18nRuntimeConfig } from "@/utils/i18n/runtime";
import type {
    PostCategory,
    PostContentResponse,
    PostListResponse,
    PostSeries,
} from "@/utils/content/local";

/**
 * 归一化列表查询使用的语言标识
 *
 * 统一将来自前端的多种语言写法（如 en-US、zh-Hans）映射为数据库中实际存储的 locale 值，
 * 避免前后端语言约定不一致导致查询不到任何记录。
 *
 * @param rawLocale 前端传入的原始语言标识
 * @returns 数据库可用的语言标识
 */
function normalizeListLocale(rawLocale: string | undefined): string {
    return resolveContentLocale(rawLocale);
}

/**
 * 判断错误是否由 status 字段尚未完成数据库迁移导致
 *
 * 兼容场景：
 * - Prisma Client 仍是旧模型（Unknown arg `status`）
 * - 数据库表结构尚未包含 status 列
 *
 * @param error 捕获到的异常对象
 * @returns 是否属于 status 字段兼容性错误
 */
function isStatusFieldUnavailableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const lowered = message.toLowerCase();
    if (lowered.includes("unknown arg `status`")) {
        return true;
    }
    if (lowered.includes("column") && lowered.includes("status") && lowered.includes("does not exist")) {
        return true;
    }
    if (lowered.includes("unknown argument") && lowered.includes("status")) {
        return true;
    }
    return false;
}

/**
 * 判断当前 Prisma Client 是否已包含 Post.status 字段
 *
 * @param dbClient Prisma 客户端实例
 * @returns 是否支持 status 字段
 */
function supportsPostStatusField(dbClient: any): boolean {
    const postFields = dbClient?._runtimeDataModel?.models?.Post?.fields;
    if (!Array.isArray(postFields)) {
        return false;
    }
    return postFields.some((field: { name?: unknown }) => field?.name === "status");
}

let cachedPostStatusColumnSupport: boolean | null = null;

/**
 * 探测当前数据库是否已包含 Post.status 列，并进行进程级缓存
 *
 * 仅当 Prisma Client 声明支持 status 字段时才继续探测真实库结构，
 * 用于避免“Client 已更新但数据库尚未迁移”场景下重复触发运行时报错。
 *
 * @param dbClient Prisma 客户端实例
 * @returns 当前数据库是否可安全使用 status 字段
 */
async function canUsePostStatusField(dbClient: any): Promise<boolean> {
    if (!supportsPostStatusField(dbClient)) {
        return false;
    }
    if (cachedPostStatusColumnSupport !== null) {
        return cachedPostStatusColumnSupport;
    }
    try {
        const rows = await dbClient.$queryRaw<Array<{ column_name?: string }>>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Post'
              AND column_name = 'status'
            LIMIT 1
        `;
        cachedPostStatusColumnSupport = Array.isArray(rows) && rows.length > 0;
    } catch {
        cachedPostStatusColumnSupport = false;
    }
    return cachedPostStatusColumnSupport;
}

/**
 * 根据输入语言生成详情查询的候选语言序列
 *
 * 为了兼容现有本地 Markdown 逻辑，这里仍然保留“按语言优先级回退”的策略：
 * - 英文优先：en -> zh-CN
 * - 简体中文优先：zh-CN -> en
 * - 其他语言：当前语言 -> zh-CN -> en
 *
 * @param slug 文章唯一标识
 * @param locale 目标语言标识
 * @returns (slug, locale) 组合候选列表
 */
function buildContentLocaleCandidates(slug: string, locale: string): { slug: string; locale: string }[] {
    const i18nConfig = resolveI18nRuntimeConfig();
    if (!i18nConfig.enabled) {
        return [{ slug, locale: resolveContentLocale(null) }];
    }
    if (locale === "en") {
        return [
            { slug, locale: "en" },
            { slug, locale: "zh-CN" },
        ];
    }
    if (locale === "zh-Hans" || locale === "zh-CN") {
        return [
            { slug, locale: "zh-CN" },
            { slug, locale: "en" },
        ];
    }
    const candidates: { slug: string; locale: string }[] = [{ slug, locale }];
    if (locale !== "zh-CN") {
        candidates.push({ slug, locale: "zh-CN" });
    }
    if (locale !== "en") {
        candidates.push({ slug, locale: "en" });
    }
    return candidates;
}

/**
 * 将数据库中的分类记录映射为前端使用的 PostCategory 结构
 *
 * @param record Category 表记录
 * @returns 结构化后的分类信息
 */
function mapCategory(record: any | null | undefined): PostCategory | undefined {
    if (!record || typeof record !== "object") {
        return undefined;
    }
    if (typeof record.id !== "string") {
        return undefined;
    }
    const category: PostCategory = {
        id: record.id,
    };
    if (typeof record.labelZh === "string") {
        category.labelZh = record.labelZh;
    }
    if (typeof record.labelEn === "string") {
        category.labelEn = record.labelEn;
    }
    if (typeof record.i18nKey === "string") {
        category.i18nKey = record.i18nKey;
    }
    if (typeof record.colorToken === "string") {
        category.colorToken = record.colorToken;
    }
    if (typeof record.order === "number") {
        category.order = record.order;
    }
    return category;
}

/**
 * 将数据库中的系列记录映射为前端使用的 PostSeries 结构
 *
 * @param record Series 表记录
 * @param index 系列中的排序索引
 * @returns 结构化后的系列信息
 */
function mapSeries(record: any | null | undefined, index: number | null | undefined): PostSeries | undefined {
    if (!record || typeof record !== "object") {
        return undefined;
    }
    if (typeof record.id !== "string") {
        return undefined;
    }
    const series: PostSeries = {
        id: record.id,
    };
    if (typeof record.label === "string") {
        series.label = record.label;
    }
    if (typeof index === "number" && Number.isFinite(index)) {
        series.index = index;
    }
    return series;
}

/**
 * 从数据库读取博客文章列表
 *
 * 使用 Prisma 直接读取 Post/Category/Tag/Series 等表，并按发布时间倒序分页，
 * 返回结构与本地 Markdown 版本的 PostListResponse 保持兼容，用于后续平滑替换数据源。
 *
 * @param offset 分页偏移量（从 0 开始）
 * @param limit 每页条目数
 * @param locale 目标语言标识
 * @returns 文章列表及总数
 */
export async function getDbPostsList(
    offset: number,
    limit: number,
    locale: string = "en",
): Promise<PostListResponse> {
    const dbClient = getDbClient() as any;
    const safeOffset = Math.max(0, Math.floor(offset));
    const safeLimit = Math.max(1, Math.floor(limit));
    const normalizedLocale = normalizeListLocale(locale);
    const supportStatusField = await canUsePostStatusField(dbClient);
    const listWhereClause = supportStatusField
        ? { locale: normalizedLocale, status: "PUBLISHED" }
        : { locale: normalizedLocale };

    let total = 0;
    let posts: any[] = [];
    try {
        [total, posts] = await Promise.all([
            dbClient.post.count({
                where: listWhereClause,
            }),
            dbClient.post.findMany({
                where: listWhereClause,
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: {
                    publishedAt: "desc",
                },
                skip: safeOffset,
                take: safeLimit,
            }),
        ]);
    } catch (error) {
        if (!isStatusFieldUnavailableError(error)) {
            throw error;
        }
        [total, posts] = await Promise.all([
            dbClient.post.count({
                where: {
                    locale: normalizedLocale,
                },
            }),
            dbClient.post.findMany({
                where: {
                    locale: normalizedLocale,
                },
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: {
                    publishedAt: "desc",
                },
                skip: safeOffset,
                take: safeLimit,
            }),
        ]);
    }

    const items = posts.map((postRecord: any) => {
        const category = mapCategory(postRecord.category);
        const series = mapSeries(postRecord.series, postRecord.seriesIndex);
        const tags =
            Array.isArray(postRecord.tags) && postRecord.tags.length > 0
                ? postRecord.tags
                      .map((relationItem: any) => {
                          const tagEntity = relationItem?.tag;
                          if (!tagEntity) {
                              return undefined;
                          }
                          if (typeof tagEntity.id === "string") {
                              return tagEntity.id;
                          }
                          if (typeof tagEntity.labelEn === "string") {
                              return tagEntity.labelEn;
                          }
                          if (typeof tagEntity.labelZh === "string") {
                              return tagEntity.labelZh;
                          }
                          return undefined;
                      })
                      .filter((tagValue: unknown): tagValue is string => typeof tagValue === "string")
                : undefined;

        return {
            slug: postRecord.slug as string,
            title: (postRecord.title as string) || (postRecord.slug as string),
            description: (postRecord.description as string) || "",
            status: (postRecord.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED",
            publishedTime: (postRecord.publishedAt as Date).toISOString(),
            isPinned: Boolean(postRecord.isPinned),
            isRecommended: Boolean(postRecord.isRecommended),
            recommendRank:
                typeof postRecord.recommendRank === "number" && Number.isFinite(postRecord.recommendRank)
                    ? postRecord.recommendRank
                    : undefined,
            pinnedRank:
                typeof postRecord.pinnedRank === "number" && Number.isFinite(postRecord.pinnedRank)
                    ? postRecord.pinnedRank
                    : undefined,
            category,
            tags,
            series,
        };
    });

    return {
        items,
        total,
        locale: normalizedLocale,
    };
}

/**
 * 从数据库读取单篇文章详情
 *
 * 根据 slug 与语言候选序列依次查询 Post 记录，并在命中后返回正文内容与元数据，
 * 保持字段命名与本地 Markdown 版本一致，用于详情页数据加载。
 *
 * @param slug 文章唯一标识
 * @param locale 目标语言标识
 * @returns 文章详情结构
 */
export async function getDbPostContent(slug: string, locale: string = "en"): Promise<PostContentResponse> {
    const dbClient = getDbClient() as any;
    const candidates = buildContentLocaleCandidates(slug, locale);
    const supportStatusField = await canUsePostStatusField(dbClient);

    let matchedPost: any | null = null;
    for (const candidate of candidates) {
        let record: any | null = null;
        try {
            // eslint-disable-next-line no-await-in-loop
            record = await dbClient.post.findFirst({
                where: {
                    slug: candidate.slug,
                    locale: candidate.locale,
                    ...(supportStatusField ? { status: "PUBLISHED" } : {}),
                },
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        } catch (error) {
            if (!isStatusFieldUnavailableError(error)) {
                throw error;
            }
            // eslint-disable-next-line no-await-in-loop
            record = await dbClient.post.findFirst({
                where: {
                    slug: candidate.slug,
                    locale: candidate.locale,
                },
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        }
        if (record) {
            matchedPost = record;
            break;
        }
    }

    if (!matchedPost) {
        throw new Error(`Post not found in database: ${slug} (${locale})`);
    }

    const category = mapCategory(matchedPost.category);
    const series = mapSeries(matchedPost.series, matchedPost.seriesIndex);
    const tags =
        Array.isArray(matchedPost.tags) && matchedPost.tags.length > 0
            ? matchedPost.tags
                  .map((relationItem: any) => {
                      const tagEntity = relationItem?.tag;
                      if (!tagEntity) {
                          return undefined;
                      }
                      if (typeof tagEntity.id === "string") {
                          return tagEntity.id;
                      }
                      if (typeof tagEntity.labelEn === "string") {
                          return tagEntity.labelEn;
                      }
                      if (typeof tagEntity.labelZh === "string") {
                          return tagEntity.labelZh;
                      }
                      return undefined;
                  })
                  .filter((tagValue: unknown): tagValue is string => typeof tagValue === "string")
            : undefined;

    const response: PostContentResponse = {
        title: (matchedPost.title as string) || (matchedPost.slug as string),
        content: matchedPost.content as string,
        status: (matchedPost.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED",
        publishedTime: (matchedPost.publishedAt as Date).toISOString(),
        isPinned: Boolean(matchedPost.isPinned),
        isRecommended: Boolean(matchedPost.isRecommended),
        recommendRank:
            typeof matchedPost.recommendRank === "number" && Number.isFinite(matchedPost.recommendRank)
                ? matchedPost.recommendRank
                : undefined,
        pinnedRank:
            typeof matchedPost.pinnedRank === "number" && Number.isFinite(matchedPost.pinnedRank)
                ? matchedPost.pinnedRank
                : undefined,
        locale: matchedPost.locale as string,
        description: (matchedPost.description as string) || "",
        category,
        tags,
        series,
    };

    return response;
}

/**
 * 基于数据库的文章搜索
 *
 * 使用 Prisma 在 Post 与 Tag 关联表中执行模糊匹配搜索，支持按语言、分页返回结果，
 * 优先匹配标题和描述，其次匹配正文与标签文本，以避免结果过度噪声。
 *
 * @param keyword 搜索关键字
 * @param offset 分页偏移量（从 0 开始）
 * @param limit 每页条目数
 * @param locale 目标语言标识
 * @returns 符合条件的文章列表及总数
 */
export async function searchDbPosts(
    keyword: string,
    offset: number,
    limit: number,
    locale: string = "en",
): Promise<PostListResponse> {
    const trimmed = keyword.trim();
    if (!trimmed) {
        return {
            items: [],
            total: 0,
            locale,
        };
    }

    const dbClient = getDbClient() as any;
    const safeOffset = Math.max(0, Math.floor(offset));
    const safeLimit = Math.max(1, Math.floor(limit));
    const normalizedLocale = normalizeListLocale(locale);
    const loweredKeyword = trimmed.toLowerCase();
    const supportStatusField = await canUsePostStatusField(dbClient);

    const whereClause = {
        locale: normalizedLocale,
        ...(supportStatusField ? { status: "PUBLISHED" } : {}),
        OR: [
            {
                title: {
                    contains: loweredKeyword,
                    mode: "insensitive",
                },
            },
            {
                description: {
                    contains: loweredKeyword,
                    mode: "insensitive",
                },
            },
            {
                content: {
                    contains: loweredKeyword,
                    mode: "insensitive",
                },
            },
            {
                tags: {
                    some: {
                        tag: {
                            OR: [
                                {
                                    id: {
                                        contains: loweredKeyword,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    labelEn: {
                                        contains: loweredKeyword,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    labelZh: {
                                        contains: loweredKeyword,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    };

    let total = 0;
    let posts: any[] = [];
    try {
        [total, posts] = await Promise.all([
            dbClient.post.count({
                where: whereClause,
            }),
            dbClient.post.findMany({
                where: whereClause,
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: [
                    {
                        isPinned: "desc",
                    },
                    {
                        recommendRank: "asc",
                    },
                    {
                        publishedAt: "desc",
                    },
                ],
                skip: safeOffset,
                take: safeLimit,
            }),
        ]);
    } catch (error) {
        if (!isStatusFieldUnavailableError(error)) {
            throw error;
        }
        const { status: _removedStatus, ...legacyWhereClause } = whereClause;
        [total, posts] = await Promise.all([
            dbClient.post.count({
                where: legacyWhereClause,
            }),
            dbClient.post.findMany({
                where: legacyWhereClause,
                include: {
                    category: true,
                    series: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: [
                    {
                        isPinned: "desc",
                    },
                    {
                        recommendRank: "asc",
                    },
                    {
                        publishedAt: "desc",
                    },
                ],
                skip: safeOffset,
                take: safeLimit,
            }),
        ]);
    }

    const items = posts.map((postRecord: any) => {
        const category = mapCategory(postRecord.category);
        const series = mapSeries(postRecord.series, postRecord.seriesIndex);
        const tags =
            Array.isArray(postRecord.tags) && postRecord.tags.length > 0
                ? postRecord.tags
                      .map((relationItem: any) => {
                          const tagEntity = relationItem?.tag;
                          if (!tagEntity) {
                              return undefined;
                          }
                          if (typeof tagEntity.id === "string") {
                              return tagEntity.id;
                          }
                          if (typeof tagEntity.labelEn === "string") {
                              return tagEntity.labelEn;
                          }
                          if (typeof tagEntity.labelZh === "string") {
                              return tagEntity.labelZh;
                          }
                          return undefined;
                      })
                      .filter((tagValue: unknown): tagValue is string => typeof tagValue === "string")
                : undefined;

        return {
            slug: postRecord.slug as string,
            title: (postRecord.title as string) || (postRecord.slug as string),
            description: (postRecord.description as string) || "",
            status: (postRecord.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED",
            publishedTime: (postRecord.publishedAt as Date).toISOString(),
            isPinned: Boolean(postRecord.isPinned),
            isRecommended: Boolean(postRecord.isRecommended),
            recommendRank:
                typeof postRecord.recommendRank === "number" && Number.isFinite(postRecord.recommendRank)
                    ? postRecord.recommendRank
                    : undefined,
            pinnedRank:
                typeof postRecord.pinnedRank === "number" && Number.isFinite(postRecord.pinnedRank)
                    ? postRecord.pinnedRank
                    : undefined,
            category,
            tags,
            series,
        };
    });

    return {
        items,
        total,
        locale: normalizedLocale,
    };
}

/**
 * 获取数据库中所有文章的 slug 列表
 *
 * 该方法用于 SSG 场景下生成博客文章静态路径，避免在应用层重复编写查询逻辑，
 * 并通过 Set 去重保证同一 slug 的多语言版本仅生成一条动态路由。
 *
 * @returns 仅包含 slug 字段的文章标识列表
 */
export async function getAllDbPostSlugs(): Promise<{ slug: string }[]> {
    const dbClient = getDbClient() as any;
    const supportStatusField = await canUsePostStatusField(dbClient);
    let posts: Array<{ slug?: string }> = [];
    try {
        posts = await dbClient.post.findMany({
            ...(supportStatusField ? { where: { status: "PUBLISHED" } } : {}),
            select: {
                slug: true,
            },
            orderBy: {
                publishedAt: "desc",
            },
        });
    } catch (error) {
        if (!isStatusFieldUnavailableError(error)) {
            throw error;
        }
        posts = await dbClient.post.findMany({
            select: {
                slug: true,
            },
            orderBy: {
                publishedAt: "desc",
            },
        });
    }

    const seen = new Set<string>();
    const result: { slug: string }[] = [];
    for (const postRecord of posts) {
        const slugValue = typeof postRecord.slug === "string" ? postRecord.slug : "";
        if (!slugValue || seen.has(slugValue)) {
            // NOTE: 跳过无效或重复的 slug，避免生成无意义的静态路径
            continue;
        }
        seen.add(slugValue);
        result.push({ slug: slugValue });
    }
    return result;
}
