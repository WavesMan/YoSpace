import React from "react";
import { createPostAction } from "../actions";
import { resolveAdminEditableUiLocales, resolveI18nRuntimeConfig, toContentLocale } from "@/utils/i18n/runtime";
import styles from "../PostForm.module.css";

/**
 * 后台新建文章页面
 *
 * 提供文章标题、Slug、状态、标签、摘要、正文等字段录入能力。
 *
 * @returns 新建文章页面节点
 */
const AdminNewPostPage = () => {
  const i18nConfig = resolveI18nRuntimeConfig();
  const editableUiLocales = resolveAdminEditableUiLocales();
  const defaultContentLocale = toContentLocale(i18nConfig.defaultUiLocale);

  return (
    <div className={styles.postFormRoot}>
      <div className={styles.postFormHeader}>
        <h1 className={styles.postFormTitle}>新建文章</h1>
      </div>
      <form action={createPostAction} className={styles.postForm}>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>语种</span>
          <select
            name="locale"
            defaultValue={defaultContentLocale}
            className={styles.postFormInput}
            disabled={!i18nConfig.enabled}
          >
            {editableUiLocales.map((uiLocale) => {
              const locale = toContentLocale(uiLocale);
              return (
                <option key={uiLocale} value={locale}>
                  {uiLocale === "en-US" ? "English" : "中文"}
                </option>
              );
            })}
          </select>
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>标题</span>
          <input name="title" type="text" className={styles.postFormInput} />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>Slug</span>
          <input name="slug" type="text" className={styles.postFormInput} />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>状态</span>
          <select name="status" defaultValue="PUBLISHED" className={styles.postFormInput}>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">归档</option>
          </select>
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>标签（逗号分隔）</span>
          <input
            name="tags"
            type="text"
            className={styles.postFormInput}
            placeholder="Next.js, TypeScript"
          />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>摘要</span>
          <textarea name="description" rows={3} className={styles.postFormTextarea} />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>正文内容</span>
          <textarea
            name="content"
            rows={12}
            className={`${styles.postFormTextarea} ${styles.postFormTextareaMono}`}
          />
        </label>
        <button className={styles.postFormSubmit} type="submit">
          保存
        </button>
      </form>
    </div>
  );
};

export default AdminNewPostPage;
