import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDbClient } from '@/server/db/client';
import { updatePostAction } from '../actions';
import { normalizeUiLocale, resolveAdminEditableUiLocales, resolveI18nRuntimeConfig, toContentLocale } from '@/utils/i18n/runtime';

interface AdminEditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    locale?: string;
  }>;
}

/**
 * 判断是否为数据库连接不可用错误
 *
 * @param error 捕获到的异常
 * @returns 是否为数据库不可达错误
 */
function isDatabaseConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return lowered.includes("can't reach database server") || lowered.includes("prismaclientinitializationerror");
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
const AdminEditPostPage = async ({ params, searchParams }: AdminEditPostPageProps) => {
  const { slug } = await params;
  const query = await searchParams;
  const i18nConfig = resolveI18nRuntimeConfig();
  const activeUiLocale = i18nConfig.enabled ? normalizeUiLocale(query.locale) : i18nConfig.defaultUiLocale;
  const activeLocale = toContentLocale(activeUiLocale);
  const editableLocales = resolveAdminEditableUiLocales();
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin";
  const adminPath = adminPathRaw.startsWith("/") ? adminPathRaw : `/${adminPathRaw}`;
  let post: {
    slug: string;
    title: string;
    description: string | null;
    content: string;
    status?: string | null;
    tags: Array<{ tag?: { id?: string } }>;
  } | null = null;
  let isCurrentLocaleMissing = false;

  try {
    const db = await getDbClient();
    const currentLocalePost = await db.post.findUnique({
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

    const fallbackPost = currentLocalePost
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
      });
    post = currentLocalePost || fallbackPost;
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
          数据库暂不可用
        </h1>
        <p
          style={{
            margin: '0 0 12px',
            color: '#4b5563',
            fontSize: 14,
          }}
        >
          当前无法连接数据库，请稍后重试。
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
            返回文章列表
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
            重新尝试
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
      .map((relationItem: { tag?: { id?: string } }) => relationItem?.tag?.id)
      .filter((tagId: unknown): tagId is string => typeof tagId === 'string')
    : [];
  const tagsInput = tagValues.join(', ');

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
      {i18nConfig.enabled && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {editableLocales.map((uiLocale) => {
            const localeValue = toContentLocale(uiLocale);
            const isActive = activeLocale === localeValue;
            return (
              <Link
                key={uiLocale}
                href={`?locale=${encodeURIComponent(uiLocale)}`}
                style={{
                  border: isActive ? '1px solid #2563eb' : '1px solid #d1d5db',
                  color: isActive ? '#2563eb' : '#4b5563',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 13,
                }}
              >
                {uiLocale}
              </Link>
            );
          })}
        </div>
      )}
      {isCurrentLocaleMissing && (
        <p
          style={{
            margin: '0 0 12px',
            color: '#b45309',
            fontSize: 13,
          }}
        >
          当前语种尚无内容版本，保存后将创建该语种文章。
        </p>
      )}
      <form
        action={updatePostAction.bind(null, post.slug)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 720,
        }}
      >
        <input name="locale" type="hidden" value={activeLocale} />
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
            Slug
          </span>
          <input
            name="slug"
            defaultValue={post.slug}
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
            状态
          </span>
          <select
            name="status"
            defaultValue={post.status || 'PUBLISHED'}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">归档</option>
          </select>
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
            标签（逗号分隔）
          </span>
          <input
            name="tags"
            defaultValue={tagsInput}
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
            name="description"
            defaultValue={post.description || ''}
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
