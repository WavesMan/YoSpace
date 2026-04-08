"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminLayout.module.css";

interface AdminNavLinksProps {
  adminPath: string;
}

/**
 * 规范化路径（移除末尾斜杠，根路径除外）
 *
 * @param path 原始路径
 * @returns 规范化后的路径
 */
function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * 拼接后台子路径
 *
 * @param basePath 后台基础路径
 * @param childPath 子路径（不含前导斜杠）
 * @returns 完整路径
 */
function buildAdminPath(basePath: string, childPath: string): string {
  const normalizedBasePath = normalizePath(basePath);
  if (normalizedBasePath === "/") {
    return `/${childPath}`;
  }
  return `${normalizedBasePath}/${childPath}`;
}

/**
 * 后台导航链接组件
 *
 * 基于真实路由路径计算激活态，确保导航状态与当前页面一致。
 *
 * @param props.adminPath 后台入口路径
 * @returns 导航链接列表 JSX 节点
 */
const AdminNavLinks: React.FC<AdminNavLinksProps> = ({ adminPath }) => {
  const pathname = usePathname();
  const normalizedAdminPath = normalizePath(adminPath);
  const normalizedPathname = normalizePath(pathname || "");

  const postsPath = buildAdminPath(normalizedAdminPath, "posts");
  const settingsPath = buildAdminPath(normalizedAdminPath, "settings");
  const analyticsPostsPath = buildAdminPath(normalizedAdminPath, "analytics/posts");
  const analyticsPrefix = buildAdminPath(normalizedAdminPath, "analytics");

  const isDashboardPath = normalizedPathname === normalizedAdminPath;
  const isPostsPath = normalizedPathname.startsWith(postsPath);
  const isSettingsPath = normalizedPathname.startsWith(settingsPath);
  const isAnalyticsPath = normalizedPathname.startsWith(analyticsPrefix);

  /**
   * 生成导航链接样式
   *
   * @param active 是否激活
   * @returns 样式类名
   */
  const getNavLinkClassName = (active: boolean): string => {
    return `${styles.adminNavLink} ${active ? styles.adminNavLinkActive : ""}`.trim();
  };

  return (
    <nav className={styles.adminNav}>
      <Link className={getNavLinkClassName(isDashboardPath)} href={normalizedAdminPath}>
        仪表盘
      </Link>
      <Link className={getNavLinkClassName(isPostsPath)} href={postsPath}>
        文章管理
      </Link>
      <Link className={getNavLinkClassName(isAnalyticsPath)} href={analyticsPostsPath}>
        数据分析
      </Link>
      <Link className={getNavLinkClassName(isSettingsPath)} href={settingsPath}>
        设置中心
      </Link>
    </nav>
  );
};

export default AdminNavLinks;