import React from "react";
import { createPostAction } from "../actions";
import styles from "../PostForm.module.css";

/**
 * 新建文章页面
 *
 * 提供基础的标题、Slug、摘要与正文录入能力，
 * 通过 Server Action 将数据持久化到数据库，并触发博客页面的缓存重验证。
 *
 * @returns 新建文章页面 JSX 节点
 */
const AdminNewPostPage = () => {
  return (
    <div className={styles.postFormRoot}>
      <div className={styles.postFormHeader}>
        <h1 className={styles.postFormTitle}>
          新建文章
        </h1>
      </div>
      <form action={createPostAction} className={styles.postForm}>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            标题
          </span>
          <input
            name="title"
            type="text"
            className={styles.postFormInput}
          />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            Slug
          </span>
          <input
            name="slug"
            type="text"
            className={styles.postFormInput}
          />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            状态
          </span>
          <select
            name="status"
            defaultValue="PUBLISHED"
            className={styles.postFormInput}
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">归档</option>
          </select>
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            标签（逗号分隔）
          </span>
          <input
            name="tags"
            type="text"
            className={styles.postFormInput}
            placeholder="Next.js, TypeScript"
          />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            摘要
          </span>
          <textarea
            name="description"
            rows={3}
            className={styles.postFormTextarea}
          />
        </label>
        <label className={styles.postFormField}>
          <span className={styles.postFormLabelText}>
            正文内容
          </span>
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
