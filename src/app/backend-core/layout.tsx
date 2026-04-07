import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { isAdminRequest } from "@/server/auth/adminAuth";
import AdminLogoutButton from "./AdminLogoutButton";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * 后台统一布局组件
 *
 * 提供简单的导航栏与内容容器，用于包裹所有后台页面，
 * 避免在各个页面中重复书写布局结构，保持样式与交互一致。
 *
 * @param props.children 子页面节点
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
      {!shouldRenderLoginShell && <header className={styles.adminHeader}>
        <div className={styles.adminBrand}>
          <span className={styles.adminBrandPrimary}>YoSpace Admin</span>
          <span className={styles.adminBrandSecondary}>后台管理</span>
        </div>
        <nav className={styles.adminNav}>
          <Link className={`${styles.adminNavLink} ${styles.adminNavLinkPrimary}`} href={adminPath}>
            仪表盘
          </Link>
          <Link className={styles.adminNavLink} href={`${adminPath}/posts`}>
            文章管理
          </Link>
          {isAdmin && <AdminLogoutButton adminPath={adminPath} />}
        </nav>
      </header>}
      <main className={adminMainClassName}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
