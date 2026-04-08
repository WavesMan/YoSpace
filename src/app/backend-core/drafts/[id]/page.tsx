import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { normalizeUiLocale, resolveAdminEditableUiLocales, resolveI18nRuntimeConfig, toContentLocale } from '@/utils/i18n/runtime';
import PostEditorWithPreview from '@/app/backend-core/posts/PostEditorWithPreview';
import SaveFeedbackToast from '@/app/backend-core/posts/SaveFeedbackToast';
import { deleteDraftAction, publishDraftAction, updateDraftAction } from '@/app/backend-core/posts/draftActions';
import styles from '@/app/backend-core/posts/AdminPosts.module.css';

interface AdminEditDraftPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    locale?: string;
    saved?: string;
  }>;
}

interface PostDraftDelegate {
  findUnique: (args: unknown) => Promise<unknown>;
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
 * 草稿编辑页面
 *
 * 提供草稿保存与发布能力，并复用文章编辑器体验。
 *
 * @param props 页面参数
 * @returns 页面 JSX 节点
 */
const AdminEditDraftPage = async ({ params, searchParams }: AdminEditDraftPageProps) => {
  const { id } = await params;
  const query = await searchParams;
  const i18nConfig = resolveI18nRuntimeConfig();
  const activeUiLocale = i18nConfig.enabled ? normalizeUiLocale(query.locale) : i18nConfig.defaultUiLocale;
  const activeLocale = toContentLocale(activeUiLocale);
  const editableLocales = resolveAdminEditableUiLocales();
  const showSavedToast = query.saved === '1';
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin';
  const adminPath = adminPathRaw.startsWith('/') ? adminPathRaw : `/${adminPathRaw}`;

  const db = await getDbClient();
  const postDraft = getPostDraftDelegate(db);
  const draft = (await postDraft.findUnique({
    where: {
      id,
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
    notFound();
  }

  return (
    <div>
      <SaveFeedbackToast visible={showSavedToast} title="保存成功" description="草稿内容已更新。" />
      <div className={styles.postsFilterForm} style={{ marginBottom: 12 }}>
        <Link className={styles.postsFilterGhost} href={`${adminPath}/posts?tab=drafts`}>
          返回草稿列表
        </Link>
        <form action={deleteDraftAction.bind(null, draft.id)}>
          <button type="submit" className={styles.postsActionDanger}>
            删除草稿
          </button>
        </form>
      </div>

      <PostEditorWithPreview
        key={`draft:${draft.id}:${activeLocale}`}
        activeLocale={activeLocale}
        editableLocales={editableLocales}
        i18nEnabled={i18nConfig.enabled}
        isCurrentLocaleMissing={draft.locale !== activeLocale}
        initialValues={{
          title: draft.title,
          slug: draft.slug,
          tags: draft.tagsText || '',
          description: draft.description || '',
          content: draft.content || '',
        }}
        uiText={{
          pageTitle: '编辑草稿',
          localeMissing: '当前草稿语种与激活语种不一致，保存后将写入当前语种。',
          title: '标题',
          tags: '标签（逗号分隔）',
          description: '摘要',
          content: '正文内容（Markdown）',
          save: '保存草稿',
          publish: '发布',
          preview: '实时预览',
          previewHint: '与博客详情页同源渲染',
        }}
        saveAction={updateDraftAction.bind(null, draft.id)}
        publishAction={publishDraftAction.bind(null, draft.id)}
        showStatus={false}
        backHref={`${adminPath}/posts?tab=drafts`}
        backText="返回"
      />
    </div>
  );
};

export default AdminEditDraftPage;
