import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { getServerAdminPath } from '@/server/runtime-config/adminPath';
import { updatePostAction } from '../actions';
import {
  normalizeUiLocale,
  resolveAdminEditableUiLocales,
  resolveI18nRuntimeConfig,
  toContentLocale,
} from '@/utils/i18n/runtime';
import SaveFeedbackToast from '../SaveFeedbackToast';
import PostEditorWithPreview from '../PostEditorWithPreview';

interface AdminEditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    locale?: string;
    saved?: string;
  }>;
}

interface PostTagRelation {
  tag?: {
    id?: string;
  };
}

interface EditablePostModel {
  id: string;
  slug: string;
  locale: string;
  title: string;
  description: string | null;
  content: string;
  status?: string | null;
  tags: PostTagRelation[];
}

/**
 * 解析语种候选值
 *
 * @param locale 规范语种
 * @returns 候选语种列表
 */
function getLocaleCandidates(locale: 'zh-CN' | 'en'): string[] {
  if (locale === 'en') {
    return ['en', 'en-US'];
  }
  return ['zh-CN', 'zh'];
}

/**
 * 获取历史语种候选值（排除规范语种）
 *
 * @param locale 规范语种
 * @returns 历史候选语种列表
 */
function getLegacyLocaleCandidates(locale: 'zh-CN' | 'en'): string[] {
  return getLocaleCandidates(locale).filter((item) => item !== locale);
}

/**
 * 判断异常是否为数据库连接错误
 *
 * @param error 异常对象
 * @returns 是否为数据库连接错误
 */
function isDatabaseConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return lowered.includes("can't reach database server") || lowered.includes('prismaclientinitializationerror');
}

/**
 * 后台编辑文章页面
 *
 * 按当前语种加载文章内容，并支持同页实时预览。
 *
 * @param props 页面参数
 * @returns 编辑页面节点
 */
const AdminEditPostPage = async ({ params, searchParams }: AdminEditPostPageProps) => {
  const { slug } = await params;
  const query = await searchParams;
  const i18nConfig = resolveI18nRuntimeConfig();
  const activeUiLocale = i18nConfig.enabled ? normalizeUiLocale(query.locale) : i18nConfig.defaultUiLocale;
  const activeLocale = toContentLocale(activeUiLocale);
  const showSavedToast = query.saved === '1';
  const legacyLocaleCandidates = getLegacyLocaleCandidates(activeLocale);
  const isEnglish = activeUiLocale === 'en-US';
  const editableLocales = resolveAdminEditableUiLocales();
  const adminPath = await getServerAdminPath();

  const uiText = {
    pageTitle: isEnglish ? 'Edit Post' : '编辑文章',
    localeMissing: isEnglish
      ? 'No content found for this locale. Saving will create a locale version.'
      : '当前语种暂无内容版本，保存后将创建该语种文章。',
    dbUnavailableTitle: isEnglish ? 'Database Unavailable' : '数据库暂不可用',
    dbUnavailableDesc: isEnglish
      ? 'Cannot connect to database right now. Please try again later.'
      : '当前无法连接数据库，请稍后重试。',
    backToList: isEnglish ? 'Back to list' : '返回文章列表',
    retry: isEnglish ? 'Retry' : '重新尝试',
    title: isEnglish ? 'Title' : '标题',
    status: isEnglish ? 'Status' : '状态',
    tags: isEnglish ? 'Tags (comma separated)' : '标签（逗号分隔）',
    description: isEnglish ? 'Description' : '摘要',
    content: isEnglish ? 'Content (Markdown)' : '正文内容（Markdown）',
    save: isEnglish ? 'Save' : '保存',
    draft: isEnglish ? 'Draft' : '草稿',
    published: isEnglish ? 'Published' : '发布',
    archived: isEnglish ? 'Archived' : '归档',
    saveSuccessTitle: isEnglish ? 'Saved' : '保存成功',
    saveSuccessDesc: isEnglish ? 'Post content has been updated.' : '文章内容已更新。',
    preview: isEnglish ? 'Live Preview' : '实时预览',
    previewHint: isEnglish ? 'Same renderer as blog page' : '与博客详情页同源渲染',
  };

  let post: EditablePostModel | null = null;
  let isCurrentLocaleMissing = false;

  try {
    const db = await getDbClient();
    const exactLocalePost = await db.post.findUnique({
      where: {
        slug_locale: {
          slug,
          locale: activeLocale,
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const legacyLocalePost =
      exactLocalePost || legacyLocaleCandidates.length === 0
        ? null
        : await db.post.findFirst({
            where: {
              slug,
              locale: {
                in: legacyLocaleCandidates,
              },
            },
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          });

    const currentLocalePost = exactLocalePost || legacyLocalePost;
    const fallbackPost =
      currentLocalePost
        ? null
        : await db.post.findFirst({
            where: {
              slug,
            },
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          });

    if (currentLocalePost) {
      post = currentLocalePost;
    } else if (fallbackPost) {
      post = {
        ...fallbackPost,
        locale: activeLocale,
        title: '',
        description: '',
        content: '',
        tags: [],
      };
    }

    isCurrentLocaleMissing = !currentLocalePost;
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    return (
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {uiText.dbUnavailableTitle}
        </h1>
        <p
          style={{
            margin: '0 0 12px',
            color: '#4b5563',
            fontSize: 14,
          }}
        >
          {uiText.dbUnavailableDesc}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`${adminPath}/posts`}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 14,
            }}
          >
            {uiText.backToList}
          </Link>
          <Link
            href={`${adminPath}/posts/${encodeURIComponent(slug)}?locale=${encodeURIComponent(activeUiLocale)}`}
            style={{
              border: '1px solid #2563eb',
              color: '#2563eb',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 14,
            }}
          >
            {uiText.retry}
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const tagValues = Array.isArray(post.tags)
    ? post.tags
        .map((relationItem: PostTagRelation) => relationItem?.tag?.id)
        .filter((tagId: unknown): tagId is string => typeof tagId === 'string')
    : [];
  const tagsInput = tagValues.join(', ');

  return (
    <div>
      <SaveFeedbackToast visible={showSavedToast} title={uiText.saveSuccessTitle} description={uiText.saveSuccessDesc} />
      <PostEditorWithPreview
        key={`${slug}:${activeLocale}:${post.id}`}
        activeLocale={activeLocale}
        editableLocales={editableLocales}
        i18nEnabled={i18nConfig.enabled}
        isCurrentLocaleMissing={isCurrentLocaleMissing}
        initialValues={{
          title: post.title,
          slug: post.slug,
          status: post.status || 'PUBLISHED',
          tags: tagsInput,
          description: post.description || '',
          content: post.content || '',
        }}
        uiText={uiText}
        saveAction={updatePostAction.bind(null, slug)}
        showStatus
        backHref={`${adminPath}/posts`}
        backText={isEnglish ? 'Back' : '返回'}
      />
    </div>
  );
};

export default AdminEditPostPage;
