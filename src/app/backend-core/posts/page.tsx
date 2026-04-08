import React from 'react';
import Link from 'next/link';
import { getDbClient } from '@/server/db/client';
import { getServerAdminPath } from '@/server/runtime-config/adminPath';
import { deletePostAction } from './actions';
import { deleteDraftAction, publishDraftAction } from './draftActions';
import { resolveContentLocale } from '@/utils/i18n/runtime';
import styles from './AdminPosts.module.css';

interface AdminPostsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tab?: string;
    page?: string;
    pageSize?: string;
  }>;
}

type AdminListTab = 'posts' | 'drafts';
type PostStatusFilter = 'all' | 'published' | 'draft' | 'archived';

interface PostListItem {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date;
  updatedAt: Date;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

interface DraftListItem {
  id: string;
  title: string;
  slug: string;
  locale: string;
  updatedAt: Date;
}

interface PostDraftDelegate {
  count: (args: unknown) => Promise<number>;
  findMany: (args: unknown) => Promise<unknown>;
}

const DRAFT_PAGE_SIZE_OPTIONS = new Set([10, 20, 50]);
const DRAFT_DEFAULT_PAGE_SIZE = 20;

/**
 * 规范化状态筛选参数
 *
 * @param rawStatus 原始状态参数
 * @returns 标准化状态值
 */
function normalizeStatusFilter(rawStatus?: string): PostStatusFilter {
  if (rawStatus === 'published' || rawStatus === 'draft' || rawStatus === 'archived') {
    return rawStatus;
  }
  return 'all';
}

/**
 * 规范化列表标签参数
 *
 * @param rawTab 原始标签参数
 * @returns 标准化标签值
 */
function normalizeListTab(rawTab?: string): AdminListTab {
  return rawTab === 'drafts' ? 'drafts' : 'posts';
}

/**
 * 规范化草稿分页参数
 *
 * @param rawPage 原始页码
 * @param rawPageSize 原始每页大小
 * @returns 标准化分页参数
 */
function normalizeDraftPageQuery(rawPage?: string, rawPageSize?: string): { page: number; pageSize: number } {
  const parsedPage = Number.parseInt(rawPage || '1', 10);
  const parsedPageSize = Number.parseInt(rawPageSize || `${DRAFT_DEFAULT_PAGE_SIZE}`, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = DRAFT_PAGE_SIZE_OPTIONS.has(parsedPageSize) ? parsedPageSize : DRAFT_DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

/**
 * 判断当前 Prisma Client 是否支持 Post.status 字段
 *
 * @param db Prisma 客户端
 * @returns 是否支持 status 字段
 */
function supportsPostStatusField(db: Awaited<ReturnType<typeof getDbClient>>): boolean {
  const postFields = (db as { _runtimeDataModel?: { models?: { Post?: { fields?: Array<{ name?: unknown }> } } } })
    ._runtimeDataModel?.models?.Post?.fields;
  if (!Array.isArray(postFields)) {
    return false;
  }
  return postFields.some((field) => field?.name === 'status');
}

/**
 * 获取草稿模型委托
 *
 * @param db Prisma 客户端
 * @returns 草稿模型委托
 */
function getPostDraftDelegate(db: Awaited<ReturnType<typeof getDbClient>>): PostDraftDelegate | null {
  return ((db as unknown as { postDraft?: PostDraftDelegate }).postDraft) || null;
}

/**
 * 构建草稿分页链接
 *
 * @param page 页码
 * @param pageSize 每页大小
 * @param keyword 关键词
 * @returns 分页查询字符串
 */
function buildDraftPageHref(page: number, pageSize: number, keyword: string): string {
  const query = new URLSearchParams();
  query.set('tab', 'drafts');
  query.set('page', `${page}`);
  query.set('pageSize', `${pageSize}`);
  if (keyword) {
    query.set('q', keyword);
  }
  return `?${query.toString()}`;
}

/**
 * 后台文章管理页
 *
 * 支持正式文章与草稿列表切换，并提供筛选与草稿分页能力。
 *
 * @param props 页面查询参数
 * @returns 页面 JSX 节点
 */
const AdminPostsPage = async ({ searchParams }: AdminPostsPageProps) => {
  const query = await searchParams;
  const db = await getDbClient();
  const adminLocale = resolveContentLocale(null);
  const adminPath = await getServerAdminPath();

  const keyword = (query.q || '').trim();
  const tab = normalizeListTab(query.tab);
  const statusFilter = normalizeStatusFilter(query.status);
  const hasStatusField = supportsPostStatusField(db);

  const whereConditions: Record<string, unknown> = {
    locale: adminLocale,
    ...(keyword
      ? {
          OR: [
            {
              title: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              slug: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  if (hasStatusField && statusFilter !== 'all') {
    whereConditions.status = statusFilter.toUpperCase();
  }

  const selectFields: Record<string, boolean> = {
    id: true,
    title: true,
    slug: true,
    publishedAt: true,
    updatedAt: true,
    ...(hasStatusField ? { status: true } : {}),
  };

  const posts = (await db.post.findMany({
    where: whereConditions as never,
    orderBy: {
      updatedAt: 'desc',
    },
    select: selectFields as never,
  })) as PostListItem[];
  const postDraft = getPostDraftDelegate(db);

  const draftPageQuery = normalizeDraftPageQuery(query.page, query.pageSize);
  const draftWhere: Record<string, unknown> = {
    ...(keyword
      ? {
          OR: [
            {
              title: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
            {
              slug: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  const draftsTotal = postDraft
    ? await postDraft.count({
        where: draftWhere as never,
      })
    : 0;
  const draftTotalPages = draftsTotal === 0 ? 1 : Math.ceil(draftsTotal / draftPageQuery.pageSize);
  const draftPage = Math.min(draftPageQuery.page, draftTotalPages);
  const draftSkip = (draftPage - 1) * draftPageQuery.pageSize;
  const drafts = postDraft
    ? ((await postDraft.findMany({
        where: draftWhere as never,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: draftSkip,
        take: draftPageQuery.pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          locale: true,
          updatedAt: true,
        },
      })) as DraftListItem[])
    : [];

  const draftRangeStart = draftsTotal === 0 ? 0 : (draftPage - 1) * draftPageQuery.pageSize + 1;
  const draftRangeEnd = draftsTotal === 0 ? 0 : Math.min(draftsTotal, draftRangeStart + draftPageQuery.pageSize - 1);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentUpdatedCount = posts.filter((post) => post.updatedAt.getTime() >= sevenDaysAgo).length;
  const latestUpdatedAt = posts.length > 0 ? posts[0].updatedAt.toISOString().slice(0, 10) : '暂无';
  const statusFilterText =
    statusFilter === 'all'
      ? '全部'
      : statusFilter === 'published'
      ? '已发布'
      : statusFilter === 'draft'
      ? '草稿'
      : '已归档';

  return (
    <div className={styles.postsRoot}>
      <div className={styles.postsHeader}>
        <div>
          <h1 className={styles.postsTitle}>文章管理</h1>
          <p className={styles.postsSubtitle}>按当前语种管理文章与草稿内容。</p>
        </div>
        <Link className={styles.postsCreateButton} href={`${adminPath}/posts/new`}>
          新建文章
        </Link>
      </div>

      <div className={styles.postsTabs}>
        <Link className={`${styles.postsTab} ${tab === 'posts' ? styles.postsTabActive : ''}`} href={`${adminPath}/posts`}>
          文章
        </Link>
        <Link
          className={`${styles.postsTab} ${tab === 'drafts' ? styles.postsTabActive : ''}`}
          href={`${adminPath}/posts?tab=drafts`}
        >
          草稿
        </Link>
      </div>

      {tab === 'posts' && (
        <>
          <div className={styles.postsStatsGrid}>
            <section className={styles.postsStatsCard}>
              <div className={styles.postsStatsLabel}>筛选后总数</div>
              <div className={styles.postsStatsValue}>{posts.length}</div>
            </section>
            <section className={styles.postsStatsCard}>
              <div className={styles.postsStatsLabel}>近 7 天更新</div>
              <div className={styles.postsStatsValue}>{recentUpdatedCount}</div>
            </section>
            <section className={styles.postsStatsCard}>
              <div className={styles.postsStatsLabel}>最新更新时间</div>
              <div className={styles.postsStatsValue}>{latestUpdatedAt}</div>
            </section>
            <section className={styles.postsStatsCard}>
              <div className={styles.postsStatsLabel}>当前筛选状态</div>
              <div className={styles.postsStatsValue}>{statusFilterText}</div>
            </section>
          </div>

          <section className={styles.postsPanel}>
            <form className={styles.postsFilterForm} method="get">
              <input
                className={styles.postsFilterInput}
                name="q"
                defaultValue={keyword}
                placeholder="搜索标题或 slug..."
              />
              <select className={styles.postsFilterSelect} name="status" defaultValue={statusFilter}>
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
              <button type="submit" className={styles.postsFilterButton}>
                筛选
              </button>
              <Link className={styles.postsFilterGhost} href={`${adminPath}/posts`}>
                重置
              </Link>
            </form>

            {posts.length === 0 ? (
              <p className={styles.postsEmpty}>没有匹配文章，请调整筛选条件后重试。</p>
            ) : (
              <table className={styles.postsTable}>
                <thead>
                  <tr>
                    <th className={styles.postsHeadCell}>标题</th>
                    {hasStatusField && <th className={styles.postsHeadCell}>状态</th>}
                    <th className={styles.postsHeadCell}>Slug</th>
                    <th className={styles.postsHeadCell}>发布时间</th>
                    <th className={styles.postsHeadCell}>更新时间</th>
                    <th className={styles.postsHeadCell}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className={styles.postsCell}>{post.title}</td>
                      {hasStatusField && (
                        <td className={styles.postsCell}>
                          <span
                            className={`${styles.postsStatusBadge} ${
                              post.status === 'PUBLISHED'
                                ? styles.postsBadgePublished
                                : post.status === 'DRAFT'
                                ? styles.postsBadgeDraft
                                : styles.postsBadgeArchived
                            }`}
                          >
                            {post.status === 'PUBLISHED' ? '已发布' : post.status === 'DRAFT' ? '草稿' : '已归档'}
                          </span>
                        </td>
                      )}
                      <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>{post.slug}</td>
                      <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>
                        {post.publishedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>
                        {post.updatedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className={styles.postsCell}>
                        <div className={styles.postsActions}>
                          <Link
                            className={styles.postsActionLink}
                            href={`${adminPath}/posts/${post.slug}?locale=${encodeURIComponent(adminLocale)}`}
                          >
                            编辑
                          </Link>
                          <form
                            action={async () => {
                              'use server';
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
          </section>
        </>
      )}

      {tab === 'drafts' && (
        <section className={styles.postsPanel}>
          {!postDraft && (
            <p className={styles.postsEmpty}>
              草稿功能尚未初始化，请先执行 `pnpm prisma generate` 并重启开发服务。
            </p>
          )}
          <form className={styles.postsFilterForm} method="get">
            <input type="hidden" name="tab" value="drafts" />
            <input
              className={styles.postsFilterInput}
              name="q"
              defaultValue={keyword}
              placeholder="搜索草稿标题或 slug..."
            />
            <button type="submit" className={styles.postsFilterButton}>
              筛选
            </button>
            <Link className={styles.postsFilterGhost} href={`${adminPath}/posts?tab=drafts`}>
              重置
            </Link>
          </form>

          <p className={styles.postsDraftMeta}>
            当前显示第 {draftRangeStart}-{draftRangeEnd} 条 / 共 {draftsTotal} 条草稿
          </p>

          {drafts.length === 0 ? (
            <p className={styles.postsEmpty}>暂无草稿数据。</p>
          ) : (
            <table className={styles.postsTable}>
              <thead>
                <tr>
                  <th className={styles.postsHeadCell}>标题</th>
                  <th className={styles.postsHeadCell}>Slug</th>
                  <th className={styles.postsHeadCell}>语种</th>
                  <th className={styles.postsHeadCell}>更新时间</th>
                  <th className={styles.postsHeadCell}>操作</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id}>
                    <td className={styles.postsCell}>{draft.title}</td>
                    <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>{draft.slug}</td>
                    <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>{draft.locale}</td>
                    <td className={`${styles.postsCell} ${styles.postsCellMuted}`}>
                      {draft.updatedAt.toISOString().slice(0, 10)}
                    </td>
                    <td className={styles.postsCell}>
                      <div className={styles.postsActions}>
                        <Link className={styles.postsActionLink} href={`${adminPath}/drafts/${draft.id}`}>
                          继续编辑
                        </Link>
                        <form action={publishDraftAction.bind(null, draft.id)}>
                          <button className={styles.postsActionLinkButton} type="submit">
                            发布
                          </button>
                        </form>
                        <form action={deleteDraftAction.bind(null, draft.id)}>
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

          <div className={styles.postsDraftPagination}>
            {draftPage > 1 ? (
              <Link
                className={styles.postsFilterGhost}
                href={buildDraftPageHref(draftPage - 1, draftPageQuery.pageSize, keyword)}
              >
                上一页
              </Link>
            ) : (
              <span className={styles.postsDraftPageStatic}>上一页</span>
            )}
            <span className={styles.postsDraftPageStatic}>
              第 {draftPage} / {draftTotalPages} 页
            </span>
            {draftPage < draftTotalPages ? (
              <Link
                className={styles.postsFilterGhost}
                href={buildDraftPageHref(draftPage + 1, draftPageQuery.pageSize, keyword)}
              >
                下一页
              </Link>
            ) : (
              <span className={styles.postsDraftPageStatic}>下一页</span>
            )}
            <form className={styles.postsDraftPageSizeForm} method="get">
              <input type="hidden" name="tab" value="drafts" />
              {keyword ? <input type="hidden" name="q" value={keyword} /> : null}
              <input type="hidden" name="page" value="1" />
              <label className={styles.postsCellMuted} htmlFor="pageSize">
                每页
              </label>
              <select
                id="pageSize"
                name="pageSize"
                defaultValue={`${draftPageQuery.pageSize}`}
                className={styles.postsFilterSelect}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <button type="submit" className={styles.postsFilterButton}>
                应用
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminPostsPage;
