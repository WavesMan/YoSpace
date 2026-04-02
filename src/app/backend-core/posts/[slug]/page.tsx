import React from 'react';
import { notFound } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { updatePostAction } from '../actions';

interface AdminEditPostPageProps {
  params: {
    slug: string;
  };
}

/**
 * 编辑文章页面
 *
 * 按照传入的 slug 加载数据库中的文章内容（仅默认语言 zh-CN），
 * 管理员可对标题、摘要与正文进行修改并保存，保存后会触发博客页面缓存重验证。
 *
 * @param props.params 路由参数，包含文章 slug
 * @returns 编辑文章页面 JSX 节点
 */
const AdminEditPostPage = async ({ params }: AdminEditPostPageProps) => {
  const db = await getDbClient();
  const post = await db.post.findUnique({
    where: {
      slug_locale: {
        slug: params.slug,
        locale: 'zh-CN',
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        编辑文章
      </h1>
      <form
        action={updatePostAction.bind(null, post.slug)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 720,
        }}
      >
        <label
          style={{
            fontSize: 14,
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: 4,
            }}
          >
            标题
          </span>
          <input
            name="title"
            defaultValue={post.title}
            type="text"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          />
        </label>
        <label
          style={{
            fontSize: 14,
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: 4,
            }}
          >
            摘要
          </span>
          <textarea
            name="summary"
            defaultValue={post.summary || ''}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          />
        </label>
        <label
          style={{
            fontSize: 14,
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: 4,
            }}
          >
            正文内容
          </span>
          <textarea
            name="content"
            defaultValue={post.content || ''}
            rows={12}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 14,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            width: 120,
            padding: '8px 10px',
            fontSize: 14,
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: '#2563eb',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          保存
        </button>
      </form>
    </div>
  );
};

export default AdminEditPostPage;

