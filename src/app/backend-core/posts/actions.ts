'use server';

import { revalidatePath } from 'next/cache';
import { getDbClient } from '@/server/db/client';

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
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const description = String(formData.get('description') ?? formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') || '').trim();

  if (!title || !slug || !content) {
    throw new Error('标题、Slug 与内容为必填项');
  }

  await db.post.upsert({
    where: {
      slug_locale: {
        slug,
        locale: 'zh-CN',
      },
    },
    update: {
      title,
      description,
      content,
    },
    create: {
      title,
      slug,
      description,
      content,
      locale: 'zh-CN',
    },
  });

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
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') ?? formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') || '').trim();

  if (!title || !content) {
    throw new Error('标题与内容为必填项');
  }

  const target = await db.post.findUnique({
    where: {
      slug_locale: {
        slug,
        locale: 'zh-CN',
      },
    },
  });

  if (!target) {
    throw new Error('待更新文章不存在');
  }

  await db.post.update({
    where: {
      id: target.id,
    },
    data: {
      title,
      description,
      content,
    },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
}

/**
 * 删除博客文章（仅针对默认语言 zh-CN）
 *
 * 依据 slug 定位文章并删除记录，若文章不存在则视为幂等删除，
 * 删除后会同步触发列表与详情页缓存重验证。
 *
 * @param slug 待删除文章的唯一标识
 */
export async function deletePostAction(slug: string): Promise<void> {
  const db = await getDbClient();

  const target = await db.post.findUnique({
    where: {
      slug_locale: {
        slug,
        locale: 'zh-CN',
      },
    },
  });

  if (!target) {
    revalidatePath('/blog');
    return;
  }

  await db.post.delete({
    where: {
      id: target.id,
    },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
}
