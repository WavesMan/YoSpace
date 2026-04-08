import React from "react";
import Link from "next/link";
import {
  getAdminPathViewsPage,
  normalizeAdminPageQuery,
} from "@/server/analytics/service";
import { getServerAdminPath } from "@/server/runtime-config/adminPath";
import styles from "../AnalyticsPage.module.css";

interface AdminAnalyticsPathsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

/**
 * 构建分页链接
 *
 * @param page 页码
 * @param pageSize 每页条数
 * @returns 查询字符串
 */
function buildPageHref(page: number, pageSize: number): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

/**
 * 计算当前页展示区间
 *
 * @param page 当前页码
 * @param pageSize 每页条数
 * @param total 总条数
 * @returns 起止区间
 */
function getDisplayRange(page: number, pageSize: number, total: number): { start: number; end: number } {
  if (total <= 0) {
    return { start: 0, end: 0 };
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, start + pageSize - 1);
  return { start, end };
}

/**
 * 后台访问路径分析页
 *
 * 展示全部访问路径聚合分页列表。
 *
 * @param props 查询参数
 * @returns 页面 JSX 节点
 */
const AdminAnalyticsPathsPage = async ({ searchParams }: AdminAnalyticsPathsPageProps) => {
  const query = await searchParams;
  const pageQuery = normalizeAdminPageQuery(query);
  const result = await getAdminPathViewsPage(pageQuery);
  const range = getDisplayRange(result.page, result.pageSize, result.total);
  const prevPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);
  const adminPath = await getServerAdminPath();

  return (
    <div className={styles.analyticsRoot}>
      <div className={styles.analyticsHeader}>
        <div>
          <h1 className={styles.analyticsTitle}>全部访问路径</h1>
          <p className={styles.analyticsSubtitle}>按访问次数排序的完整路径聚合列表。</p>
        </div>
        <div className={styles.analyticsPager}>
          <Link className={styles.analyticsBackLink} href={`${adminPath}/analytics/posts`}>
            文章阅读量
          </Link>
          <Link className={styles.analyticsBackLink} href={adminPath}>
            返回仪表盘
          </Link>
        </div>
      </div>

      <section className={styles.analyticsPanel}>
        <p className={styles.analyticsMeta}>
          当前显示第 {range.start}-{range.end} 条 / 共 {result.total} 条
        </p>

        {result.items.length === 0 ? (
          <p className={styles.analyticsEmpty}>暂无访问路径数据。</p>
        ) : (
          <div className={styles.analyticsTableWrap}>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>路径</th>
                  <th>访问次数</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.path}>
                    <td>{item.path}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.analyticsPagination}>
          <div className={styles.analyticsPager}>
            {result.page > 1 ? (
              <Link className={styles.analyticsPagerLink} href={buildPageHref(prevPage, result.pageSize)}>
                上一页
              </Link>
            ) : (
              <span className={styles.analyticsPagerCurrent}>上一页</span>
            )}
            <span className={styles.analyticsPagerCurrent}>
              第 {result.page} / {result.totalPages} 页
            </span>
            {result.page < result.totalPages ? (
              <Link className={styles.analyticsPagerLink} href={buildPageHref(nextPage, result.pageSize)}>
                下一页
              </Link>
            ) : (
              <span className={styles.analyticsPagerCurrent}>下一页</span>
            )}
          </div>

          <form className={styles.analyticsPageSizeForm} method="get">
            <input type="hidden" name="page" value="1" />
            <label className={styles.analyticsPageInfo} htmlFor="pageSize">
              每页
            </label>
            <select id="pageSize" name="pageSize" defaultValue={`${result.pageSize}`} className={styles.analyticsSelect}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <button type="submit" className={styles.analyticsApplyButton}>
              应用
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalyticsPathsPage;
