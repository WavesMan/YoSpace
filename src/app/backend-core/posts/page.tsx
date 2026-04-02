import React from 'react';
import Link from 'next/link';
import { getDbClient } from '@/server/db/client';
import { deletePostAction } from './actions';

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
  const posts = await db.post.findMany({
    where: {
      locale: 'zh-CN',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          文章管理
        </h1>
        <Link
          href="posts/new"
          style={{
            fontSize: 14,
            padding: '6px 10px',
            borderRadius: 4,
            backgroundColor: '#2563eb',
            color: '#ffffff',
          }}
        >
          新建文章
        </Link>
      </div>
      {posts.length === 0 ? (
        <p>暂无文章，请先通过「新建文章」创建首篇内容。</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 6px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                标题
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 6px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                Slug
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 6px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                创建时间
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 6px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post: {
              id: string;
              title: string;
              slug: string;
              createdAt: Date;
              updatedAt: Date;
            }) => (
              <tr key={post.id}>
                <td
                  style={{
                    padding: '8px 6px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  {post.title}
                </td>
                <td
                  style={{
                    padding: '8px 6px',
                    borderBottom: '1px solid #f3f4f6',
                    color: '#6b7280',
                  }}
                >
                  {post.slug}
                </td>
                <td
                  style={{
                    padding: '8px 6px',
                    borderBottom: '1px solid #f3f4f6',
                    color: '#6b7280',
                  }}
                >
                  {post.createdAt.toISOString().slice(0, 10)}
                </td>
                <td
                  style={{
                    padding: '8px 6px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <Link
                    href={`posts/${post.slug}`}
                    style={{
                      fontSize: 13,
                      color: '#2563eb',
                    }}
                  >
                    编辑
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      await deletePostAction(post.slug);
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        fontSize: 13,
                        color: '#b91c1c',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      删除
                    </button>
                  </form>
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
