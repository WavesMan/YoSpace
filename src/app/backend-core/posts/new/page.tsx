import React from 'react';
import { createDraftAction } from '../draftActions';
import {
  normalizeUiLocale,
  resolveAdminEditableUiLocales,
  resolveI18nRuntimeConfig,
  toContentLocale,
} from '@/utils/i18n/runtime';
import { getServerAdminPath } from '@/server/runtime-config/adminPath';
import PostEditorWithPreview from '../PostEditorWithPreview';

interface AdminNewPostPageProps {
  searchParams: Promise<{
    locale?: string;
  }>;
}

/**
 * 后台新建文章页面
 *
 * 复用完整编辑器体验，默认保存为独立草稿。
 *
 * @param props 页面查询参数
 * @returns 新建文章页面节点
 */
const AdminNewPostPage = async ({ searchParams }: AdminNewPostPageProps) => {
  const query = await searchParams;
  const i18nConfig = resolveI18nRuntimeConfig();
  const editableUiLocales = resolveAdminEditableUiLocales();
  const activeUiLocale = i18nConfig.enabled ? normalizeUiLocale(query.locale) : i18nConfig.defaultUiLocale;
  const activeLocale = toContentLocale(activeUiLocale);
  const adminPath = await getServerAdminPath();

  return (
    <PostEditorWithPreview
      key={`new:${activeLocale}`}
      activeLocale={activeLocale}
      editableLocales={editableUiLocales}
      i18nEnabled={i18nConfig.enabled}
      isCurrentLocaleMissing={false}
      initialValues={{
        title: '',
        slug: '',
        tags: '',
        description: '',
        content: '',
      }}
      uiText={{
        pageTitle: '新建文章草稿',
        localeMissing: '',
        title: '标题',
        tags: '标签（逗号分隔）',
        description: '摘要',
        content: '正文内容（Markdown）',
        save: '保存草稿',
        preview: '实时预览',
        previewHint: '与博客详情页同源渲染',
      }}
      showStatus={false}
      saveAction={createDraftAction}
      backHref={`${adminPath}/posts`}
      backText="返回"
    />
  );
};

export default AdminNewPostPage;
