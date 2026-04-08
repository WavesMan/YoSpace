'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { resolveContentLocale, toUiLocale } from '@/utils/i18n/runtime';

/**
 * 解析后台根路径
 *
 * @returns 后台根路径
 */
function resolveAdminPath(): string {
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin';
  return adminPathRaw.startsWith('/') ? adminPathRaw : `/${adminPathRaw}`;
}

interface PostDraftDelegate {
  findUnique: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  deleteMany: (args: unknown) => Promise<unknown>;
}

/**
 * 获取草稿模型委托
 *
 * @param db Prisma 客户端
 * @returns 草稿模型委托
 */
function getPostDraftDelegate(db: Awaited<ReturnType<typeof getDbClient>>): PostDraftDelegate {
  const delegate = (db as unknown as { postDraft?: PostDraftDelegate }).postDraft;
  if (!delegate) {
    throw new Error('当前 Prisma Client 未包含 PostDraft 模型，请先执行 prisma generate 并重启开发服务');
  }
  return delegate;
}

/**
 * 解析后台提交的文章语种
 *
 * @param rawValue 表单中的原始语种
 * @returns 归一化后的内容语种
 */
function resolveAdminPostLocale(rawValue: FormDataEntryValue | null): 'zh-CN' | 'en' {
  if (typeof rawValue !== 'string') {
    return resolveContentLocale(null);
  }
  return resolveContentLocale(rawValue);
}

/**
 * 校验并归一化 slug
 *
 * @param rawSlug 原始 slug 文本
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
 * @param rawTags 标签文本
 * @returns 去重后的标签列表
 */
function parseTags(rawTags: string): string[] {
  const tags = rawTags
    .split(/[,，\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

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
  return postFields.some((field) => field?.name === 'status');
}

/**
 * 判断异常是否由 status 字段不可用导致
 *
 * @param error 捕获到的异常
 * @returns 是否属于 status 字段兼容错误
 */
function isStatusFieldUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return (
    lowered.includes('unknown arg `status`')
    || (lowered.includes('unknown argument') && lowered.includes('status'))
    || (lowered.includes('column') && lowered.includes('status') && lowered.includes('does not exist'))
  );
}

/**
 * 获取内容语种候选列表（兼容历史值）
 *
 * @param locale 归一化语种
 * @returns 语种候选列表
 */
function resolveLocaleCandidates(locale: 'zh-CN' | 'en'): string[] {
  if (locale === 'en') {
    return ['en', 'en-US'];
  }
  return ['zh-CN', 'zh'];
}

/**
 * 根据 slug 与语种候选查询正式文章
 *
 * @param db Prisma 客户端
 * @param slug 文章 slug
 * @param locale 归一化语种
 * @returns 正式文章简要信息
 */
async function findPostBySlugWithLocaleFallback(
  db: Awaited<ReturnType<typeof getDbClient>>,
  slug: string,
  locale: 'zh-CN' | 'en',
): Promise<{ id: string; slug: string } | null> {
  return db.post.findFirst({
    where: {
      slug,
      locale: {
        in: resolveLocaleCandidates(locale),
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

/**
 * 同步文章与标签关系
 *
 * @param db Prisma 客户端
 * @param postId 文章 ID
 * @param tags 标签列表
 */
async function syncPostTags(
  db: Awaited<ReturnType<typeof getDbClient>>,
  postId: string,
  tags: string[],
): Promise<void> {
  await db.postTag.deleteMany({
    where: {
      postId,
    },
  });

  if (tags.length === 0) {
    return;
  }

  const tagRecords = await Promise.all(
    tags.map((tagValue) =>
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
 * 创建草稿
 *
 * @param formData 草稿表单数据
 */
export async function createDraftAction(formData: FormData): Promise<void> {
  const db = await getDbClient();
  const postDraft = getPostDraftDelegate(db);
  const adminPath = resolveAdminPath();
  const locale = resolveAdminPostLocale(formData.get('locale'));
  const title = String(formData.get('title') || '').trim();
  const slug = normalizeSlug(String(formData.get('slug') || ''));
  const description = String(formData.get('description') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const tagsText = String(formData.get('tags') || '').trim();

  if (!title || !slug || !content) {
    throw new Error('标题、Slug 与内容为必填项');
  }

  const existedPost = await findPostBySlugWithLocaleFallback(db, slug, locale);
  if (existedPost) {
    throw new Error('该 Slug 已存在于正式文章，请修改后重试');
  }

  const existedDraft = await postDraft.findUnique({
    where: {
      slug_locale: {
        slug,
        locale,
      },
    },
    select: {
      id: true,
    },
  });

  if (existedDraft) {
    throw new Error('该 Slug 已存在于草稿，请修改后重试');
  }

  await postDraft.create({
    data: {
      title,
      slug,
      locale,
      description,
      content,
      tagsText,
    },
  });

  revalidatePath(`${adminPath}/posts`);
  redirect(`${adminPath}/posts?tab=drafts&saved=1`);
}

/**
 * 更新草稿
 *
 * @param draftId 草稿 ID
 * @param formData 草稿表单数据
 */
export async function updateDraftAction(draftId: string, formData: FormData): Promise<void> {
  const db = await getDbClient();
  const postDraft = getPostDraftDelegate(db);
  const adminPath = resolveAdminPath();
  const locale = resolveAdminPostLocale(formData.get('locale'));
  const uiLocale = toUiLocale(locale);
  const title = String(formData.get('title') || '').trim();
  const nextSlug = normalizeSlug(String(formData.get('slug') || ''));
  const description = String(formData.get('description') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const tagsText = String(formData.get('tags') || '').trim();

  if (!title || !content) {
    throw new Error('标题与内容为必填项');
  }

  const target = (await postDraft.findUnique({
    where: {
      id: draftId,
    },
    select: {
      id: true,
      slug: true,
      locale: true,
    },
  })) as { id: string; slug: string; locale: string } | null;

  if (!target) {
    throw new Error('草稿不存在或已被删除');
  }

  const slugConflictDraft = (await postDraft.findUnique({
    where: {
      slug_locale: {
        slug: nextSlug,
        locale,
      },
    },
    select: {
      id: true,
    },
  })) as { id: string } | null;
  if (slugConflictDraft && slugConflictDraft.id !== draftId) {
    throw new Error('目标 Slug 已存在于其他草稿，请更换后重试');
  }

  await postDraft.update({
    where: {
      id: draftId,
    },
    data: {
      title,
      slug: nextSlug,
      locale,
      description,
      content,
      tagsText,
    },
  });

  revalidatePath(`${adminPath}/posts`);
  revalidatePath(`${adminPath}/drafts/${draftId}`);
  redirect(`${adminPath}/drafts/${draftId}?locale=${encodeURIComponent(uiLocale)}&saved=1`);
}

/**
 * 删除草稿并返回草稿列表
 *
 * @param draftId 草稿 ID
 */
export async function deleteDraftAction(draftId: string): Promise<void> {
  const db = await getDbClient();
  const postDraft = getPostDraftDelegate(db);
  const adminPath = resolveAdminPath();

  await postDraft.deleteMany({
    where: {
      id: draftId,
    },
  });

  revalidatePath(`${adminPath}/posts`);
  redirect(`${adminPath}/posts?tab=drafts`);
}

/**
 * 发布草稿
 *
 * @param draftId 草稿 ID
 */
export async function publishDraftAction(draftId: string): Promise<void> {
  const db = await getDbClient();
  const postDraft = getPostDraftDelegate(db);
  const adminPath = resolveAdminPath();
  const supportStatusField = supportsPostStatusField(db);

  const draft = (await postDraft.findUnique({
    where: {
      id: draftId,
    },
    select: {
      id: true,
      slug: true,
      locale: true,
      title: true,
      description: true,
      content: true,
      tagsText: true,
    },
  })) as {
    id: string;
    slug: string;
    locale: string;
    title: string;
    description: string | null;
    content: string;
    tagsText: string | null;
  } | null;

  if (!draft) {
    throw new Error('草稿不存在或已被删除');
  }

  const locale = resolveAdminPostLocale(draft.locale);
  const uiLocale = toUiLocale(locale);
  const conflictPost = await findPostBySlugWithLocaleFallback(db, draft.slug, locale);
  if (conflictPost) {
    throw new Error('发布失败：Slug 与现有文章冲突，请先修改草稿 Slug');
  }

  const tags = parseTags(draft.tagsText || '');
  let createdPost: { id: string; slug: string };
  try {
    createdPost = await db.post.create({
      data: {
        title: draft.title,
        slug: draft.slug,
        locale,
        description: draft.description || '',
        content: draft.content,
        ...(supportStatusField ? { status: 'PUBLISHED' } : {}),
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
        title: draft.title,
        slug: draft.slug,
        locale,
        description: draft.description || '',
        content: draft.content,
      },
      select: {
        id: true,
        slug: true,
      },
    });
  }

  await syncPostTags(db, createdPost.id, tags);
  await postDraft.delete({
    where: {
      id: draftId,
    },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${createdPost.slug}`);
  revalidatePath(`${adminPath}/posts`);
  redirect(
    `${adminPath}/posts/${encodeURIComponent(createdPost.slug)}?locale=${encodeURIComponent(uiLocale)}&saved=1`,
  );
}
