import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { isAdminRequest } from "@/server/auth/adminAuth";
import { getServerAdminPath } from "@/server/runtime-config/adminPath";
import { getAdminDashboardMetrics } from "@/server/analytics/service";
import styles from "./AdminDashboard.module.css";

/**
 * 格式化日期为 yyyy-mm-dd
 *
 * @param value 原始日期字符串
 * @returns 格式化后的日期字符串
 */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * 后台仪表盘页面
 *
 * 展示内容概览与访问统计，并提供常用操作入口。
 *
 * @returns 仪表盘 JSX 节点
 */
const DashboardPage = async () => {
  const cookieStore = await cookies();
  const usernameFromCookie = cookieStore.get("yo_admin_username")?.value;
  const isAdmin = await isAdminRequest();
  const metrics = isAdmin ? await getAdminDashboardMetrics(7) : null;
  const adminPath = await getServerAdminPath();

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>后台仪表盘</h1>
          <p className={styles.dashboardSubtitle}>查看内容规模、访问趋势与站点状态。</p>
        </div>
        <div className={styles.dashboardToolbar}>
          <Link className={styles.dashboardActionGhost} href={`${adminPath}/posts`}>
            进入文章管理
          </Link>
          <Link className={styles.dashboardActionPrimary} href={`${adminPath}/posts/new`}>
            新建文章
          </Link>
        </div>
      </div>

      {!isAdmin && <p className={styles.dashboardWarning}>当前会话未通过管理员认证。</p>}

      {isAdmin && metrics && (
        <>
          <p className={styles.dashboardWelcome}>欢迎回来，{usernameFromCookie || "管理员"}。</p>

          <div className={styles.dashboardStatsGrid}>
            <section className={styles.dashboardStatsCard}>
              <div className={styles.dashboardStatsLabel}>文章总数</div>
              <div className={styles.dashboardStatsValue}>{metrics.totalPosts}</div>
            </section>
            <section className={styles.dashboardStatsCard}>
              <div className={styles.dashboardStatsLabel}>已发布文章</div>
              <div className={styles.dashboardStatsValue}>{metrics.publishedPosts}</div>
            </section>
            <section className={styles.dashboardStatsCard}>
              <div className={styles.dashboardStatsLabel}>累计阅读量</div>
              <div className={styles.dashboardStatsValue}>{metrics.totalViews}</div>
            </section>
            <section className={styles.dashboardStatsCard}>
              <div className={styles.dashboardStatsLabel}>近 7 天访问</div>
              <div className={styles.dashboardStatsValue}>{metrics.recentVisits}</div>
              <div className={styles.dashboardStatsSub}>UV: {metrics.recentUniqueVisitors}</div>
            </section>
          </div>

          <div className={styles.dashboardPanelGrid}>
            <section className={styles.dashboardPanel}>
              <div className={styles.dashboardPanelHeader}>
                <h2 className={styles.dashboardPanelTitle}>热门文章（按阅读量）</h2>
                <Link className={styles.dashboardPanelMore} href={`${adminPath}/analytics/posts?page=1&pageSize=20`}>
                  查看全部
                </Link>
              </div>
              {metrics.topPosts.length === 0 ? (
                <p className={styles.dashboardEmpty}>暂无数据</p>
              ) : (
                <table className={styles.dashboardTable}>
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>阅读量</th>
                      <th>更新时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topPosts.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.views}</td>
                        <td>{formatDate(item.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className={styles.dashboardPanel}>
              <h2 className={styles.dashboardPanelTitle}>近 7 天访客趋势</h2>
              {metrics.visitTrend.length === 0 ? (
                <p className={styles.dashboardEmpty}>暂无数据</p>
              ) : (
                <table className={styles.dashboardTable}>
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>访问次数</th>
                      <th>独立访客</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.visitTrend.map((item) => (
                      <tr key={item.day}>
                        <td>{item.day}</td>
                        <td>{item.visits}</td>
                        <td>{item.uniqueVisitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className={`${styles.dashboardPanel} ${styles.dashboardPanelWide}`}>
              <div className={styles.dashboardPanelHeader}>
                <h2 className={styles.dashboardPanelTitle}>热门访问路径</h2>
                <Link className={styles.dashboardPanelMore} href={`${adminPath}/analytics/paths?page=1&pageSize=20`}>
                  查看全部
                </Link>
              </div>
              {metrics.topPaths.length === 0 ? (
                <p className={styles.dashboardEmpty}>暂无数据</p>
              ) : (
                <table className={styles.dashboardTable}>
                  <thead>
                    <tr>
                      <th>路径</th>
                      <th>访问次数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topPaths.map((item) => (
                      <tr key={item.path}>
                        <td>{item.path}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
