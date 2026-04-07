'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { resolveContentLocale, toUiLocale } from '@/utils/i18n/runtime';

type AdminPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * 判断异常是否由 status 字段兼容问题导致
 *
 * @param error 捕获到的异常
 * @returns 是否属于 status 字段兼容错误
 */
function isStatusFieldUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  if (lowered.includes('unknown arg `status`')) {
    return true;
  }
  if (lowered.includes('unknown argument') && lowered.includes('status')) {
    return true;
  }
  if (lowered.includes('column') && lowered.includes('status') && lowered.includes('does not exist')) {
    return true;
  }
  return false;
}

/**
 * 判断当前 Prisma Client 是否已包含 Post.status 字段
 *
 * @param db 数据库客户端
 * @returns 是否支持 status 字段
 */
function supportsPostStatusField(db: Awaited<ReturnType<typeof getDbClient>>): boolean {
  const postFields = (db as { _runtimeDataModel?: { models?: { Post?: { fields?: Array<{ name?: unknown }> } } } })
    ._runtimeDataModel?.models?.Post?.fields;
  if (!Array.isArray(postFields)) {
    return false;
  }
  return postFields.some(field => field?.name === 'status');
}

/**
 * 解析后台提交的文章状态
 *
 * @param rawValue 表单中的原始状态值
 * @returns 归一化后的文章状态
 */
function resolvePostStatus(rawValue: FormDataEntryValue | null): AdminPostStatus {
  if (typeof rawValue !== 'string') {
    return 'PUBLISHED';
  }
  const upper = rawValue.trim().toUpperCase();
  if (upper === 'DRAFT' || upper === 'ARCHIVED' || upper === 'PUBLISHED') {
    return upper;
  }
  return 'PUBLISHED';
}

/**
 * 解析后台提交的文章语种
 *
 * @param rawValue 表单中的原始语种值
 * @returns 归一化后的内容语种
 */
function resolveAdminPostLocale(rawValue: FormDataEntryValue | null): 'zh-CN' | 'en' {
  if (typeof rawValue !== 'string') {
    return resolveContentLocale(null);
  }
  return resolveContentLocale(rawValue);
}

/**
 * 解析后台根路径
 *
 * 根据环境变量统一构建后台访问前缀，确保跳转路径稳定。
 *
 * @returns 后台根路径
 */
function resolveAdminPath(): string {
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin';
  return adminPathRaw.startsWith('/') ? adminPathRaw : `/${adminPathRaw}`;
}

/**
 * 解析内容语种候选列表（兼容历史值）
 *
 * 旧数据中可能存在 `en-US` 或 `zh`，这里统一在查询阶段兼容，
 * 保证切换语言后仍可命中对应语种记录。
 *
 * @param locale 归一化后的内容语种
 * @returns 可用于查询的语种候选列表
 */
function resolveLocaleCandidates(locale: 'zh-CN' | 'en'): string[] {
  if (locale === 'en') {
    return ['en', 'en-US'];
  }
  return ['zh-CN', 'zh'];
}

/**
 * 获取历史兼容语种候选（排除当前规范语种）
 *
 * @param locale 当前规范语种
 * @returns 历史兼容语种列表
 */
function resolveLegacyLocaleCandidates(locale: 'zh-CN' | 'en'): string[] {
  return resolveLocaleCandidates(locale).filter(item => item !== locale);
}

/**
 * 按 slug + 语种兼容策略查询文章
 *
 * 优先精确匹配规范语种；若不存在则回退历史语种值。
 *
 * @param db 数据库客户端
 * @param slug 文章 slug
 * @param locale 规范语种
 * @returns 命中的文章记录或 null
 */
async function findPostBySlugWithLocaleFallback(
  db: Awaited<ReturnType<typeof getDbClient>>,
  slug: string,
  locale: 'zh-CN' | 'en',
): Promise<{ id: string; slug: string; locale: string } | null> {
  const exact = await db.post.findUnique({
    where: {
      slug_locale: {
        slug,
        locale,
      },
    },
    select: {
      id: true,
      slug: true,
      locale: true,
    },
  });
  if (exact) {
    return exact;
  }

  const legacyCandidates = resolveLegacyLocaleCandidates(locale);
  if (legacyCandidates.length === 0) {
    return null;
  }

  return db.post.findFirst({
    where: {
      slug,
      locale: {
        in: legacyCandidates,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      slug: true,
      locale: true,
    },
  });
}

/**
 * 校验并归一化 slug
 *
 * @param rawSlug 表单中的 slug 文本
 * @returns 归一化后的 slug
 */
function normalizeSlug(rawSlug: string): string {
  const slug = rawSlug.trim().toLowerCase();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    throw new Error('Slug 仅允许小写字母、数字与中划线，且不能以中划线开头或结尾');
  }
  return slug;
}

/**
 * 解析标签输入并去重
 *
 * @param rawTags 标签输入文本
 * @returns 去重后的标签数组
 */
function parseTags(rawTags: string): string[] {
  const tags = rawTags
    .split(/[,，]/g)
    .map(item => item.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

/**
 * 同步文章与标签关系
 *
 * @param db 数据库客户端
 * @param postId 文章 ID
 * @param tags 标签列表
 */
async function syncPostTags(db: Awaited<ReturnType<typeof getDbClient>>, postId: string, tags: string[]): Promise<void> {
  await db.postTag.deleteMany({
    where: {
      postId,
    },
  });

  if (tags.length === 0) {
    return;
  }

  const tagRecords = await Promise.all(
    tags.map(tagValue =>
      db.tag.upsert({
        where: {
          id: tagValue,
        },
        update: {
          labelEn: tagValue,
          labelZh: null,
        },
        create: {
          id: tagValue,
          labelEn: tagValue,
          labelZh: null,
        },
      }),
    ),
  );

  await db.postTag.createMany({
    data: tagRecords.map((tagRecord: { id: string }) => ({
      postId,
      tagId: tagRecord.id,
    })),
    skipDuplicates: true,
  });
}

/**
 * 写入 slug 重定向映射（若运行时已支持该模型）
 *
 * 兼容在本地尚未执行 prisma generate / migrate 的场景，
 * 当委托不可用时仅记录日志并继续主流程。
 *
 * @param db 数据库客户端
 * @param oldSlug 旧 slug
 * @param newSlug 新 slug
 */
async function upsertSlugRedirect(
  db: Awaited<ReturnType<typeof getDbClient>>,
  oldSlug: string,
  newSlug: string,
  locale: 'zh-CN' | 'en',
): Promise<void> {
  const redirectDelegate = (db as {
    postSlugRedirect?: {
      upsert?: (args: {
        where: { oldSlug_locale: { oldSlug: string; locale: string } };
        update: { newSlug: string };
        create: { oldSlug: string; newSlug: string; locale: string };
      }) => Promise<unknown>;
    };
  }).postSlugRedirect;

  if (!redirectDelegate || typeof redirectDelegate.upsert !== 'function') {
    console.warn('[admin] postSlugRedirect delegate unavailable, skip slug redirect upsert');
    return;
  }

  await redirectDelegate.upsert({
    where: {
      oldSlug_locale: {
        oldSlug,
        locale,
      },
    },
    update: {
      newSlug,
    },
    create: {
      oldSlug,
      newSlug,
      locale,
    },
  });
}

/**
 * 删除 slug 重定向映射（若运行时已支持该模型）
 *
 * @param db 数据库客户端
 * @param slug 文章 slug
 */
async function cleanupSlugRedirect(
  db: Awaited<ReturnType<typeof getDbClient>>,
  slug: string,
  locale: 'zh-CN' | 'en',
): Promise<void> {
  const redirectDelegate = (db as {
    postSlugRedirect?: {
      deleteMany?: (args: {
        where: {
          OR: Array<{ oldSlug?: string; newSlug?: string; locale: string }>;
        };
      }) => Promise<unknown>;
    };
  }).postSlugRedirect;

  if (!redirectDelegate || typeof redirectDelegate.deleteMany !== 'function') {
    console.warn('[admin] postSlugRedirect delegate unavailable, skip slug redirect cleanup');
    return;
  }

  await redirectDelegate.deleteMany({
    where: {
      OR: [
        {
          oldSlug: slug,
          locale,
        },
        {
          newSlug: slug,
          locale,
        },
      ],
    },
  });
}

/**
 * 新建博客文章（仅针对默认语言 zh-CN）
 *
 * 通过表单提交的核心字段写入 Post 表，未传递的可选字段使用合理默认值，
 * 当前仅支持单语言写入，未来如需多语言可在此处扩展为批量插入。
 *
 * @param formData 提交的表单数据
 */
export async function createPostAction(formData: FormData): Promise<void> {
  const db = await getDbClient();
  const locale = resolveAdminPostLocale(formData.get('locale'));
  const title = String(formData.get('title') || '').trim();
  const slug = normalizeSlug(String(formData.get('slug') || ''));
  const description = String(formData.get('description') ?? formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') || '').trim();
  const status = resolvePostStatus(formData.get('status'));
  const tags = parseTags(String(formData.get('tags') || ''));
  const supportStatusField = supportsPostStatusField(db);

  if (!title || !slug || !content) {
    throw new Error('标题、Slug 与内容为必填项');
  }

  const existingPost = await findPostBySlugWithLocaleFallback(db, slug, locale);
  if (existingPost) {
    throw new Error('Slug 已存在，请更换后重试');
  }

  let createdPost: { id: string };
  try {
    createdPost = await db.post.create({
      data: {
        title,
        slug,
        description,
        content,
        ...(supportStatusField ? { status } : {}),
        locale,
      },
    });
  } catch (error) {
    if (!isStatusFieldUnavailableError(error)) {
      throw error;
    }
    createdPost = await db.post.create({
      data: {
        title,
        slug,
        description,
        content,
        locale,
      },
    });
  }

  await syncPostTags(db, createdPost.id, tags);

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
}

/**
 * 更新博客文章（仅针对默认语言 zh-CN）
 *
 * 依据 slug 精确定位文章并更新标题、摘要与正文，
 * 若文章不存在则抛出错误，避免误认为更新成功。
 *
 * @param slug 文章唯一标识
 * @param formData 提交的表单数据
 */
export async function updatePostAction(slug: string, formData: FormData): Promise<void> {
  const db = await getDbClient();
  const locale = resolveAdminPostLocale(formData.get('locale'));
  const adminPath = resolveAdminPath();
  const uiLocale = toUiLocale(locale);
  const title = String(formData.get('title') || '').trim();
  const nextSlug = normalizeSlug(String(formData.get('slug') || slug));
  const description = String(formData.get('description') ?? formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') || '').trim();
  const status = resolvePostStatus(formData.get('status'));
  const tags = parseTags(String(formData.get('tags') || ''));
  const supportStatusField = supportsPostStatusField(db);

  if (!title || !content) {
    throw new Error('标题与内容为必填项');
  }

  const target = await findPostBySlugWithLocaleFallback(db, slug, locale);

  if (!target) {
    const existedSameSlug = await findPostBySlugWithLocaleFallback(db, nextSlug, locale);
    if (existedSameSlug) {
      throw new Error('目标 Slug 已存在，请更换后重试');
    }

    let createdPost: { id: string; slug: string };
    try {
      createdPost = await db.post.create({
        data: {
          title,
          slug: nextSlug,
          description,
          content,
          ...(supportStatusField ? { status } : {}),
          locale,
        },
        select: {
          id: true,
          slug: true,
        },
      });
    } catch (error) {
      if (!isStatusFieldUnavailableError(error)) {
        throw error;
      }
      createdPost = await db.post.create({
        data: {
          title,
          slug: nextSlug,
          description,
          content,
          locale,
        },
        select: {
          id: true,
          slug: true,
        },
      });
    }

    await syncPostTags(db, createdPost.id, tags);
    revalidatePath('/blog');
    revalidatePath(`/blog/${createdPost.slug}`);
    redirect(
      `${adminPath}/posts/${encodeURIComponent(createdPost.slug)}?locale=${encodeURIComponent(uiLocale)}&saved=1`,
    );
  }

  if (nextSlug !== slug) {
    const slugConflictPost = await findPostBySlugWithLocaleFallback(db, nextSlug, locale);
    if (slugConflictPost && slugConflictPost.id !== target.id) {
      throw new Error('目标 Slug 已存在，请更换后重试');
    }
  }

  try {
    await db.post.update({
      where: {
        id: target.id,
      },
      data: {
        title,
        slug: nextSlug,
        description,
        content,
        ...(supportStatusField ? { status } : {}),
      },
    });
  } catch (error) {
    if (!isStatusFieldUnavailableError(error)) {
      throw error;
    }
    await db.post.update({
      where: {
        id: target.id,
      },
      data: {
        title,
        slug: nextSlug,
        description,
        content,
      },
    });
  }

  if (nextSlug !== slug) {
    await upsertSlugRedirect(db, slug, nextSlug, locale);
  }

  await syncPostTags(db, target.id, tags);

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath(`/blog/${nextSlug}`);
  redirect(
    `${adminPath}/posts/${encodeURIComponent(nextSlug)}?locale=${encodeURIComponent(uiLocale)}&saved=1`,
  );
}

/**
 * 删除博客文章（仅针对默认语言 zh-CN）
 *
 * 依据 slug 定位文章并删除记录，若文章不存在则视为幂等删除，
 * 删除后会同步触发列表与详情页缓存重验证。
 *
 * @param slug 待删除文章的唯一标识
 */
export async function deletePostAction(slug: string, locale: 'zh-CN' | 'en' = resolveContentLocale(null)): Promise<void> {
  const db = await getDbClient();
  const target = await findPostBySlugWithLocaleFallback(db, slug, locale);

  if (!target) {
    revalidatePath('/blog');
    return;
  }

  await db.post.delete({
    where: {
      id: target.id,
    },
  });
  await cleanupSlugRedirect(db, slug, locale);

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
}
