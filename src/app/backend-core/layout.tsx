import React from "react";
import Link from "next/link";
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
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const adminPathRaw = process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin";
  const adminPath = adminPathRaw.startsWith("/") ? adminPathRaw : `/${adminPathRaw}`;
  return (
    <div className={styles.adminRoot}>
      <header className={styles.adminHeader}>
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
        </nav>
      </header>
      <main className={styles.adminMain}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
