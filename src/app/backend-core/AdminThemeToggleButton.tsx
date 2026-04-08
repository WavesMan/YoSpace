"use client";

import React, { useEffect, useSyncExternalStore } from "react";
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
  if (typeof window === "undefined") {
    return "light";
  }
  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeThemeMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    onStoreChange();
  };

  media.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener("yospace-theme-change", handleChange);

  return () => {
    media.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("yospace-theme-change", handleChange);
  };
}

function getThemeModeSnapshot(): ThemeMode {
  return resolveCurrentThemeMode();
}

function getThemeModeServerSnapshot(): ThemeMode {
  return "light";
}

/**
 * 后台主题切换按钮
 *
 * 复用全站主题存储键 `theme`，切换时同步更新 body 的 data-theme。
 *
 * @returns 主题切换按钮 JSX 节点
 */
const AdminThemeToggleButton: React.FC = () => {
  const themeMode = useSyncExternalStore(
    subscribeThemeMode,
    getThemeModeSnapshot,
    getThemeModeServerSnapshot,
  );

  useEffect(() => {
    document.body.className = themeMode;
    document.body.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  /**
   * 切换主题并写入本地存储
   *
   * @returns void
   */
  const handleToggleTheme = (): void => {
    const nextThemeMode: ThemeMode = themeMode === "dark" ? "light" : "dark";
    window.localStorage.setItem("theme", nextThemeMode);
    document.body.className = nextThemeMode;
    document.body.setAttribute("data-theme", nextThemeMode);
    window.dispatchEvent(new Event("yospace-theme-change"));
  };

  const buttonText = themeMode === "dark" ? "浅色模式" : "深色模式";

  return (
    <button
      type="button"
      className={styles.adminThemeToggleButton}
      onClick={handleToggleTheme}
      aria-pressed={themeMode === "dark"}
    >
      {buttonText}
    </button>
  );
};

export default AdminThemeToggleButton;
