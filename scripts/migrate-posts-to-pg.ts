import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Prisma } from "@prisma/client";
import { getDbClient } from "@/server/db/client";
import type { PostCategory, PostSeries } from "@/utils/content/local";

interface ParsedFileMeta {
    slug: string;
    locale: string;
}

interface FrontmatterShape {
    title?: unknown;
    description?: unknown;
    date?: unknown;
    isPinned?: unknown;
    isRecommended?: unknown;
    recommendRank?: unknown;
    pinnedRank?: unknown;
    category?: unknown;
    categories?: unknown;
    tags?: unknown;
    series?: unknown;
    [key: string]: unknown;
}

const postsDirectory = path.join(process.cwd(), "src/content/posts");

const standardMetaKeys: string[] = [
    "title",
    "description",
    "date",
    "isPinned",
    "isRecommended",
    "recommendRank",
    "pinnedRank",
    "category",
    "categories",
    "tags",
    "series",
];

/**
 * 从文件名中解析 slug 与语言标识
 *
 * 命名约定：
 * - xxx.md 表示英文内容（en）
 * - xxx.zh-CN.md 等带有语言后缀的文件表示对应语言版本
 *
 * @param fileName Markdown 文件名
 * @returns 解析后的 slug 与 locale 信息
 */
function parseFileMetadata(fileName: string): ParsedFileMeta {
    const nameWithoutExt = fileName.replace(/\.md$/i, "");
    const parts = nameWithoutExt.split(".");
    if (parts.length === 1) {
        return { slug: parts[0], locale: "en" };
    }
    const slug = parts[0];
    const locale = parts.slice(1).join(".") || "en";
    return { slug, locale };
}

/**
 * 将 Frontmatter 中的分类信息解析为标准 Category 结构
 *
 * @param rawCategory 前端 Markdown Frontmatter 中的 category 或 categories 字段
 * @returns 标准化后的分类结构或 undefined
 */
function parseCategory(rawCategory: unknown): PostCategory | undefined {
    if (!rawCategory || typeof rawCategory !== "object") {
        return undefined;
    }
    const candidate = rawCategory as {
        id?: unknown;
        labelZh?: unknown;
        labelEn?: unknown;
        i18nKey?: unknown;
        colorToken?: unknown;
        order?: unknown;
    };
    if (typeof candidate.id !== "string") {
        return undefined;
    }
    const category: PostCategory = {
        id: candidate.id,
    };
    if (typeof candidate.labelZh === "string") {
        category.labelZh = candidate.labelZh;
    }
    if (typeof candidate.labelEn === "string") {
        category.labelEn = candidate.labelEn;
    }
    if (typeof candidate.i18nKey === "string") {
        category.i18nKey = candidate.i18nKey;
    }
    if (typeof candidate.colorToken === "string") {
        category.colorToken = candidate.colorToken;
    }
    if (typeof candidate.order === "number" && Number.isFinite(candidate.order)) {
        category.order = candidate.order;
    }
    return category;
}

/**
 * 提取 Frontmatter 中非标准字段，写入数据库 JSONB meta 字段
 *
 * @param frontmatter 原始 Frontmatter 对象
 * @returns 仅包含扩展字段的对象
 */
function extractMeta(frontmatter: FrontmatterShape): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    Object.entries(frontmatter).forEach(([key, value]) => {
        if (!standardMetaKeys.includes(key)) {
            meta[key] = value;
        }
    });
    return meta;
}

/**
 * 扫描本地 Markdown 文件并同步到 PostgreSQL
 *
 * 该脚本用于一次性或按需重复执行的迁移作业：
 * - 从 src/content/posts 读取所有 Markdown 文件
 * - 解析 Frontmatter 与正文内容
 * - 更新或插入 Post、Category、Tag、Series 等数据库记录
 * - 使用幂等 upsert 策略，保证多次执行不会产生重复数据
 */
async function migratePostsToDatabase(): Promise<void> {
    const dbClient = getDbClient();

    if (!fs.existsSync(postsDirectory)) {
        console.warn("本地 posts 目录不存在，跳过迁移：", postsDirectory);
        return;
    }

    const fileNames = fs.readdirSync(postsDirectory).filter(file => file.endsWith(".md"));

    for (const fileName of fileNames) {
        const fullPath = path.join(postsDirectory, fileName);
        const fileContent = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContent);

        const frontmatter = data as FrontmatterShape;
        const { slug, locale } = parseFileMetadata(fileName);

        const rawTitle = frontmatter.title;
        const rawDescription = frontmatter.description;
        const rawDate = frontmatter.date;
        const rawIsPinned = frontmatter.isPinned;
        const rawIsRecommended = frontmatter.isRecommended;
        const rawRecommendRank = frontmatter.recommendRank;
        const rawPinnedRank = frontmatter.pinnedRank;
        const rawCategory = frontmatter.category ?? frontmatter.categories;
        const rawTags = frontmatter.tags;
        const rawSeries = frontmatter.series as PostSeries | undefined;

        const title = typeof rawTitle === "string" && rawTitle.trim().length > 0 ? rawTitle : slug;
        const description =
            typeof rawDescription === "string" && rawDescription.trim().length > 0 ? rawDescription : "";

        const publishedAt =
            typeof rawDate === "string" && rawDate.trim().length > 0 ? new Date(rawDate) : new Date(0);

        const isPinned = typeof rawIsPinned === "boolean" ? rawIsPinned : false;
        const isRecommended = typeof rawIsRecommended === "boolean" ? rawIsRecommended : false;

        let recommendRank: number | null = null;
        if (typeof rawRecommendRank === "number" && Number.isFinite(rawRecommendRank)) {
            recommendRank = rawRecommendRank;
        } else if (typeof rawRecommendRank === "string") {
            const parsed = parseInt(rawRecommendRank, 10);
            if (Number.isFinite(parsed)) {
                recommendRank = parsed;
            }
        }

        let pinnedRank: number | null = null;
        if (typeof rawPinnedRank === "number" && Number.isFinite(rawPinnedRank)) {
            pinnedRank = rawPinnedRank;
        } else if (typeof rawPinnedRank === "string") {
            const parsedPinned = parseInt(rawPinnedRank, 10);
            if (Number.isFinite(parsedPinned)) {
                pinnedRank = parsedPinned;
            }
        }

        const category = parseCategory(rawCategory);
        const tags = Array.isArray(rawTags)
            ? rawTags.filter(tagItem => typeof tagItem === "string") as string[]
            : [];

        const meta = extractMeta(frontmatter) as Prisma.InputJsonValue;

        let categoryId: string | null = null;
        if (category) {
            const categoryRecord = await dbClient.category.upsert({
                where: { id: category.id },
                update: {
                    labelZh: category.labelZh ?? null,
                    labelEn: category.labelEn ?? null,
                    i18nKey: category.i18nKey ?? null,
                    colorToken: category.colorToken ?? null,
                    order: category.order ?? 0,
                },
                create: {
                    id: category.id,
                    labelZh: category.labelZh ?? null,
                    labelEn: category.labelEn ?? null,
                    i18nKey: category.i18nKey ?? null,
                    colorToken: category.colorToken ?? null,
                    order: category.order ?? 0,
                },
            });
            categoryId = categoryRecord.id;
        }

        let seriesId: string | null = null;
        let seriesIndex: number | null = null;
        if (rawSeries && typeof rawSeries.id === "string") {
            const seriesRecord = await dbClient.series.upsert({
                where: { id: rawSeries.id },
                update: {
                    label: typeof rawSeries.label === "string" ? rawSeries.label : null,
                },
                create: {
                    id: rawSeries.id,
                    label: typeof rawSeries.label === "string" ? rawSeries.label : null,
                },
            });
            seriesId = seriesRecord.id;
            if (typeof rawSeries.index === "number" && Number.isFinite(rawSeries.index)) {
                seriesIndex = rawSeries.index;
            }
        }

        const tagRecords = await Promise.all(
            tags.map(tagValue =>
                dbClient.tag.upsert({
                    where: { id: tagValue },
                    update: {
                        labelZh: null,
                        labelEn: tagValue,
                    },
                    create: {
                        id: tagValue,
                        labelZh: null,
                        labelEn: tagValue,
                    },
                }),
            ),
        );

        const postRecord = await dbClient.post.upsert({
            where: {
                slug_locale: {
                    slug,
                    locale,
                },
            },
            update: {
                title,
                description,
                content,
                isPinned,
                isRecommended,
                recommendRank: recommendRank ?? undefined,
                pinnedRank: pinnedRank ?? undefined,
                publishedAt,
                meta,
                categoryId: categoryId ?? undefined,
                seriesId: seriesId ?? undefined,
                seriesIndex: seriesIndex ?? undefined,
            },
            create: {
                slug,
                locale,
                title,
                description,
                content,
                isPinned,
                isRecommended,
                recommendRank: recommendRank ?? undefined,
                pinnedRank: pinnedRank ?? undefined,
                publishedAt,
                meta,
                categoryId: categoryId ?? undefined,
                seriesId: seriesId ?? undefined,
                seriesIndex: seriesIndex ?? undefined,
            },
        });

        if (tagRecords.length > 0) {
            await dbClient.postTag.deleteMany({
                where: {
                    postId: postRecord.id,
                },
            });

            await dbClient.postTag.createMany({
                data: tagRecords.map((tagRecord: { id: string }) => ({
                    postId: postRecord.id,
                    tagId: tagRecord.id,
                })),
                skipDuplicates: true,
            });
        }

        console.log(`已迁移文章：${slug} (${locale})`);
    }
}

migratePostsToDatabase()
    .catch(error => {
        console.error("迁移过程中发生错误：", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        const dbClient = getDbClient();
        await dbClient.$disconnect();
    });
