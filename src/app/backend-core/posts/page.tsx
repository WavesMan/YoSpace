import React from "react";
import Link from "next/link";
import { getDbClient } from "@/server/db/client";
import { deletePostAction } from "./actions";
import { resolveContentLocale } from "@/utils/i18n/runtime";
import styles from "./AdminPosts.module.css";

/**
 * 后台文章列表页面
 *
 * 展示当前数据库中已存在的博客文章（仅默认语言 zh-CN），
 * 支持跳转到编辑页面以及直接删除文章。
 *
 * @returns 文章列表 JSX 节点
 */
const AdminPostsPage = async () => {
  const db = await getDbClient();
  const adminLocale = resolveContentLocale(null);
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin";
  const adminPath = adminPathRaw.startsWith("/") ? adminPathRaw : `/${adminPathRaw}`;
  const posts = await db.post.findMany({
    where: {
      locale: adminLocale,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className={styles.postsRoot}>
      <div className={styles.postsHeader}>
        <h1 className={styles.postsTitle}>
          文章管理
        </h1>
        <Link className={styles.postsCreateButton} href={`${adminPath}/posts/new`}>
          新建文章
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className={styles.postsEmpty}>暂无文章，请先通过「新建文章」创建首篇内容。</p>
      ) : (
        <table className={styles.postsTable}>
          <thead>
            <tr>
              <th className={styles.postsHeadCell}>
                标题
              </th>
              <th className={styles.postsHeadCell}>
                Slug
              </th>
              <th className={styles.postsHeadCell}>
                创建时间
              </th>
              <th className={styles.postsHeadCell}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post: {
              id: string;
              title: string;
              slug: string;
              publishedAt: Date;
              updatedAt: Date;
            }) => (
              <tr key={post.id}>
                <td className={styles.postsCell}>
                  {post.title}
                </td>
                <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>
                  {post.slug}
                </td>
                <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>
                  {post.publishedAt.toISOString().slice(0, 10)}
                </td>
                <td className={styles.postsCell}>
                  <div className={styles.postsActions}>
                    <Link className={styles.postsActionLink} href={`${adminPath}/posts/${post.slug}?locale=${encodeURIComponent(adminLocale)}`}>
                      编辑
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deletePostAction(post.slug, adminLocale);
                      }}
                    >
                      <button className={styles.postsActionDanger} type="submit">
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPostsPage;
