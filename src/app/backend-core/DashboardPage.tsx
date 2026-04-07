import React from "react";
import { cookies } from "next/headers";
import { isAdminRequest } from "@/server/auth/adminAuth";
import { getAdminDashboardMetrics } from "@/server/analytics/service";
import styles from "./AdminDashboard.module.css";

/**
 * 格式化日期为 yyyy-mm-dd
 *
 * @param value 原始日期字符串
 * @returns 格式化日期文本
 */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * 后台仪表盘首页
 *
 * 展示管理员欢迎信息、内容规模、阅读访问统计与热门文章，
 * 作为前后台分离后的后台入口页，不依赖前台博客组件。
 *
 * @returns 后台首页 JSX 节点
 */
const DashboardPage = async () => {
  const cookieStore = await cookies();
  const usernameFromCookie = cookieStore.get("yo_admin_username")?.value;
  const isAdmin = await isAdminRequest();
  const metrics = isAdmin ? await getAdminDashboardMetrics(7) : null;

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>后台仪表盘</h1>
      </div>
      {!isAdmin && <p className={styles.dashboardWarning}>当前未登录管理员，请返回登录页重新登录。</p>}
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
              <div className={styles.dashboardStatsLabel}>近7天访问</div>
              <div className={styles.dashboardStatsValue}>{metrics.recentVisits}</div>
              <div className={styles.dashboardStatsSub}>UV: {metrics.recentUniqueVisitors}</div>
            </section>
          </div>
          <div className={styles.dashboardPanelGrid}>
            <section className={styles.dashboardPanel}>
              <h2 className={styles.dashboardPanelTitle}>热门文章（按阅读量）</h2>
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
                    {metrics.topPosts.map(item => (
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
              <h2 className={styles.dashboardPanelTitle}>近7天访客趋势</h2>
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
                    {metrics.visitTrend.map(item => (
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
            <section className={styles.dashboardPanel}>
              <h2 className={styles.dashboardPanelTitle}>热门访问路径</h2>
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
                    {metrics.topPaths.map(item => (
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

