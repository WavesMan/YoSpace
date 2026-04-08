import React from "react";
import { headers } from "next/headers";
import { isAdminRequest } from "@/server/auth/adminAuth";
import AdminLogoutButton from "./AdminLogoutButton";
import AdminThemeToggleButton from "./AdminThemeToggleButton";
import AdminNavLinks from "./AdminNavLinks";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * 后台统一布局组件
 *
 * 提供后台导航栏和内容容器，统一承载后台页面。
 *
 * @param props.children 页面主体内容
 * @returns 后台布局 JSX 节点
 */
const AdminLayout: React.FC<AdminLayoutProps> = async ({ children }) => {
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin";
  const adminPath = adminPathRaw.startsWith("/") ? adminPathRaw : `/${adminPathRaw}`;

  const isAdmin = await isAdminRequest();
  const requestHeaders = await headers();
  const requestPathname = requestHeaders.get("x-yospace-pathname") || "";
  const isUnifiedAdminEntry = requestPathname === adminPath;
  const shouldRenderLoginShell = isUnifiedAdminEntry && !isAdmin;
  const adminMainClassName = shouldRenderLoginShell
    ? `${styles.adminMain} ${styles.adminMainLogin}`
    : styles.adminMain;

  return (
    <div className={styles.adminRoot}>
      {!shouldRenderLoginShell && (
        <header className={styles.adminHeader}>
          <div className={styles.adminBrand}>
            <span className={styles.adminBrandPrimary}>YoSpace Admin</span>
            <span className={styles.adminBrandSecondary}>后台管理</span>
          </div>
          <div className={styles.adminHeaderActions}>
            <AdminNavLinks adminPath={adminPath} />
            <div className={styles.adminTools}>
              <AdminThemeToggleButton />
              {isAdmin && <AdminLogoutButton adminPath={adminPath} />}
            </div>
          </div>
        </header>
      )}
      <main className={adminMainClassName}>{children}</main>
    </div>
  );
};

export default AdminLayout;
