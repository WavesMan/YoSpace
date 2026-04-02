import React from 'react';
import { createPostAction } from '../actions';

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
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        新建文章
      </h1>
      <form
        action={createPostAction}
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
            Slug
          </span>
          <input
            name="slug"
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

export default AdminNewPostPage;

