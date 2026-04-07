import React from "react";
import { cookies } from "next/headers";
import { isAdminRequest } from "@/server/auth/adminAuth";
import styles from "./AdminDashboard.module.css";

/**
 * 后台仪表盘首页
 *
 * 展示当前登录管理员的基础信息与常用入口，
 * 方便在登录成功后快速跳转到文章管理等核心功能。
 *
 * @returns 后台首页 JSX 节点
 */
const AdminHomePage = async () => {
  const cookieStore = await cookies();
  const usernameFromCookie = cookieStore.get("yo_admin_username")?.value;
  const isAdmin = await isAdminRequest();

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          后台仪表盘
        </h1>
      </div>
      {!isAdmin && (
        <p className={styles.dashboardWarning}>
          当前未登录管理员，请返回登录页重新登录。
        </p>
      )}
      {isAdmin && (
        <>
          <p className={styles.dashboardWelcome}>
            欢迎回来，{usernameFromCookie || "管理员"}。
          </p>
          <ul className={styles.dashboardList}>
            <li>通过顶部导航进入「文章管理」，可以查看与编辑博客文章。</li>
            <li>文章变更后系统会自动触发博客列表与详情页的缓存重验证。</li>
          </ul>
        </>
      )}
    </div>
  );
};

export default AdminHomePage;
