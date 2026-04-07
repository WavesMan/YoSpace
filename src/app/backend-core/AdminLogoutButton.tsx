"use client";

import React, { useState } from "react";
import styles from "./AdminLayout.module.css";

interface AdminLogoutButtonProps {
  adminPath: string;
}

/**
 * 后台退出登录按钮
 *
 * 通过调用 /api/admin/logout 清理管理员 Cookie，
 * 完成后统一跳转至 /admin 入口页由中间件自动分流。
 *
 * @param props.adminPath 后台入口路径
 * @returns 退出按钮 JSX 节点
 */
const AdminLogoutButton: React.FC<AdminLogoutButtonProps> = ({ adminPath }) => {
  const [submitting, setSubmitting] = useState(false);

  /**
   * 执行退出登录请求并跳转至后台入口
   *
   * @returns Promise<void>
   */
  const handleLogout = async (): Promise<void> => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } catch {
    } finally {
      window.location.href = adminPath;
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={submitting}
      className={styles.adminLogoutButton}
    >
      {submitting ? "退出中..." : "退出登录"}
    </button>
  );
};

export default AdminLogoutButton;

