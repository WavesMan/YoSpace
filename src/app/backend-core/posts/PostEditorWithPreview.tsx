'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { UiLocale, toContentLocale } from '@/utils/i18n/runtime';
import postFormStyles from './PostForm.module.css';
import editorStyles from './PostEditorWithPreview.module.css';
import AdminMarkdownPreview from './AdminMarkdownPreview';

interface PostEditorWithPreviewProps {
  activeLocale: 'zh-CN' | 'en';
  editableLocales: UiLocale[];
  i18nEnabled: boolean;
  isCurrentLocaleMissing: boolean;
  initialValues: {
    title: string;
    slug: string;
    status?: string;
    tags: string;
    description: string;
    content: string;
  };
  uiText: {
    pageTitle: string;
    localeMissing: string;
    title: string;
    status?: string;
    tags: string;
    description: string;
    content: string;
    save: string;
    draft?: string;
    published?: string;
    archived?: string;
    publish?: string;
    preview: string;
    previewHint: string;
  };
  saveAction: (formData: FormData) => void | Promise<void>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  showStatus?: boolean;
  backHref?: string;
  backText?: string;
}

/**
 * 文章编辑与实时预览组合面板
 *
 * 左侧负责编辑表单输入，右侧复用博客渲染组件进行实时预览。
 *
 * @param props 编辑器参数
 * @returns 编辑与预览组合面板
 */
function PostEditorWithPreview({
  activeLocale,
  editableLocales,
  i18nEnabled,
  isCurrentLocaleMissing,
  initialValues,
  uiText,
  saveAction,
  publishAction,
  showStatus = true,
  backHref,
  backText = '返回',
}: PostEditorWithPreviewProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [postSlug, setPostSlug] = useState(initialValues.slug);
  const [status, setStatus] = useState(initialValues.status || 'PUBLISHED');
  const [tags, setTags] = useState(initialValues.tags);
  const [description, setDescription] = useState(initialValues.description);
  const [content, setContent] = useState(initialValues.content);

  const previewTags = useMemo(() => {
    return tags
      .split(/[,，\n]/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }, [tags]);

  return (
    <div className={editorStyles.editorPage}>
      {backHref && (
        <div className={editorStyles.editorTopBar}>
          <Link href={backHref} className={editorStyles.editorBackLink}>
            {backText}
          </Link>
        </div>
      )}
      <h1 className={editorStyles.editorTitle}>{uiText.pageTitle}</h1>

      {i18nEnabled && (
        <div className={editorStyles.localeTabs}>
          {editableLocales.map((uiLocale) => {
            const localeValue = toContentLocale(uiLocale);
            const isActive = activeLocale === localeValue;
            const localeLabel = uiLocale === 'en-US' ? 'English' : '中文';
            return (
              <Link
                key={uiLocale}
                href={`?locale=${encodeURIComponent(uiLocale)}`}
                className={`${editorStyles.localeTab} ${isActive ? editorStyles.localeTabActive : ''}`}
              >
                {localeLabel}
              </Link>
            );
          })}
        </div>
      )}

      {isCurrentLocaleMissing && <p className={editorStyles.localeWarning}>{uiText.localeMissing}</p>}

      <div className={editorStyles.editorLayout}>
        <div className={editorStyles.editorFormCard}>
          <form action={saveAction} className={editorStyles.editorForm}>
            <input name="locale" type="hidden" value={activeLocale} />

            <label className={editorStyles.editorField}>
              <span className={editorStyles.editorLabelText}>{uiText.title}</span>
              <input
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                type="text"
                className={postFormStyles.postFormInput}
              />
            </label>

            <label className={editorStyles.editorField}>
              <span className={editorStyles.editorLabelText}>Slug</span>
              <input
                name="slug"
                value={postSlug}
                onChange={(event) => {
                  setPostSlug(event.target.value);
                }}
                type="text"
                className={postFormStyles.postFormInput}
              />
            </label>

            {showStatus && (
              <label className={editorStyles.editorField}>
                <span className={editorStyles.editorLabelText}>{uiText.status || '状态'}</span>
                <select
                  name="status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                  }}
                  className={postFormStyles.postFormInput}
                >
                  <option value="DRAFT">{uiText.draft || '草稿'}</option>
                  <option value="PUBLISHED">{uiText.published || '发布'}</option>
                  <option value="ARCHIVED">{uiText.archived || '归档'}</option>
                </select>
              </label>
            )}

            <label className={editorStyles.editorField}>
              <span className={editorStyles.editorLabelText}>{uiText.tags}</span>
              <input
                name="tags"
                value={tags}
                onChange={(event) => {
                  setTags(event.target.value);
                }}
                type="text"
                className={postFormStyles.postFormInput}
              />
            </label>

            <label className={editorStyles.editorField}>
              <span className={editorStyles.editorLabelText}>{uiText.description}</span>
              <textarea
                name="description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
                rows={3}
                className={postFormStyles.postFormTextarea}
              />
            </label>

            <label className={editorStyles.editorField}>
              <span className={editorStyles.editorLabelText}>{uiText.content}</span>
              <textarea
                name="content"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                }}
                rows={16}
                className={`${postFormStyles.postFormTextarea} ${postFormStyles.postFormTextareaMono}`}
              />
            </label>

            <div className={postFormStyles.postFormActions}>
              <button type="submit" className={postFormStyles.postFormSubmit}>
                {uiText.save}
              </button>
              {publishAction && (
                <button type="submit" formAction={publishAction} className={postFormStyles.postFormSecondary}>
                  {uiText.publish || '发布'}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className={editorStyles.previewCard}>
          <div className={editorStyles.previewHeader}>
            <h2 className={editorStyles.previewTitle}>{uiText.preview}</h2>
            <p className={editorStyles.previewHint}>{uiText.previewHint}</p>
          </div>
          <div className={editorStyles.previewBody}>
            <h1 className={editorStyles.previewPostTitle}>{title || 'Untitled'}</h1>
            {description.trim() ? <p className={editorStyles.previewDescription}>{description}</p> : null}
            {previewTags.length > 0 && (
              <div className={editorStyles.previewTags}>
                {previewTags.map((tag) => (
                  <span key={tag} className={editorStyles.previewTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className={editorStyles.previewMarkdown}>
              <AdminMarkdownPreview content={content} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PostEditorWithPreview;