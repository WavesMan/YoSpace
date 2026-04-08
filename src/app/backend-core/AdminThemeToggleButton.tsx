"use client";

import React, { useEffect, useState } from "react";
import styles from "./AdminLayout.module.css";

type ThemeMode = "light" | "dark";

/**
 * 解析当前主题模式
 *
 * 优先读取 localStorage 中的主题设置，其次回退到系统主题偏好。
 *
 * @returns 当前主题模式
 */
function resolveCurrentThemeMode(): ThemeMode {
  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * 后台主题切换按钮
 *
 * 复用全站主题存储键 `theme`，切换时同步更新 body 的 data-theme。
 *
 * @returns 主题切换按钮 JSX 节点
 */
const AdminThemeToggleButton: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const currentThemeMode = resolveCurrentThemeMode();
    setThemeMode(currentThemeMode);
    setHydrated(true);
  }, []);

  /**
   * 切换主题并写入本地存储
   *
   * @returns void
   */
  const handleToggleTheme = (): void => {
    const nextThemeMode: ThemeMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextThemeMode);
    window.localStorage.setItem("theme", nextThemeMode);
    document.body.className = nextThemeMode;
    document.body.setAttribute("data-theme", nextThemeMode);
  };

  const buttonText = themeMode === "dark" ? "浅色模式" : "深色模式";

  return (
    <button
      type="button"
      className={styles.adminThemeToggleButton}
      onClick={handleToggleTheme}
      aria-pressed={themeMode === "dark"}
      disabled={!hydrated}
    >
      {buttonText}
    </button>
  );
};

export default AdminThemeToggleButton;