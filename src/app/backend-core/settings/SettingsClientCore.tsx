"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./SettingsPage.module.css";

type RuntimeConfigType = "string" | "number" | "boolean";

interface RuntimeSettingItem {
  key: string;
  label: string;
  type: RuntimeConfigType;
  isPublic: boolean;
  description: string;
  value: string | number | boolean;
}

interface SettingsClientProps {
  initialAdminPath: string;
}

/**
 * 统一将运行时值转为可编辑文本值。
 *
 * @param value 原始值
 * @returns 可编辑文本
 */
function toInputValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

/**
 * 按配置类型解析输入值。
 *
 * @param type 配置类型
 * @param raw 输入字符串
 * @returns 解析后的值
 */
function parseInputValue(type: RuntimeConfigType, raw: string): string | number | boolean {
  if (type === "boolean") {
    return raw === "true";
  }
  if (type === "number") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return raw;
}

/**
 * 后台设置编辑客户端。
 *
 * 负责读取/保存运行时配置，并提供管理员账号密码修改入口。
 *
 * @param props 组件参数
 * @returns 设置页节点
 */
const SettingsClientCore: React.FC<SettingsClientProps> = ({ initialAdminPath }) => {
  const [items, setItems] = useState<RuntimeSettingItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [nextUsername, setNextUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialMessage, setCredentialMessage] = useState("");
  const [credentialError, setCredentialError] = useState("");

  const groupedItems = useMemo(() => {
    const site = items.filter(
      (item) => item.key.startsWith("NEXT_PUBLIC_SITE_") || item.key.startsWith("NEXT_PUBLIC_NAV_"),
    );
    const blog = items.filter(
      (item) => item.key.startsWith("NEXT_PUBLIC_BLOG_") || item.key === "NEXT_PUBLIC_USE_DB_CONTENT",
    );
    const i18n = items.filter(
      (item) =>
        item.key === "NEXT_PUBLIC_I18N" ||
        item.key === "NEXT_PUBLIC_DEFAULT_LOCALE" ||
        item.key === "NEXT_PUBLIC_SUPPORTED_LOCALES",
    );
    const profile = items.filter(
      (item) =>
        item.key.startsWith("NEXT_PUBLIC_PROFILE_") ||
        item.key === "NEXT_PUBLIC_FAVICON_URL" ||
        item.key === "NEXT_PUBLIC_ICP_CODE" ||
        item.key === "NEXT_PUBLIC_POLICE_LICENSE",
    );
    const system = items.filter(
      (item) =>
        item.key === "NEXT_PUBLIC_ADMIN_PATH" ||
        item.key === "NEXT_PUBLIC_MUSIC_API_BASE" ||
        item.key === "NEXT_PUBLIC_MUSIC_PLAYLIST_ID" ||
        item.key === "NEXT_PUBLIC_RSS_FEED_PATH" ||
        item.key === "NEXT_PUBLIC_ATOM_FEED_PATH",
    );
    return { site, blog, i18n, profile, system };
  }, [items]);

  /**
   * 加载全部可编辑配置。
   */
  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "加载配置失败");
      }
      const list = (data?.items || []) as RuntimeSettingItem[];
      setItems(list);
      setDraftValues(Object.fromEntries(list.map((item) => [item.key, toInputValue(item.value)])));
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "加载配置失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  /**
   * 更新单个配置草稿值。
   *
   * @param key 配置键
   * @param value 输入值
   */
  const setDraftValue = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * 保存配置。
   */
  const handleSaveSettings = async () => {
    if (saving || items.length === 0) {
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updates: Record<string, string | number | boolean> = {};
      for (const item of items) {
        updates[item.key] = parseInputValue(item.type, draftValues[item.key] ?? "");
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "保存失败");
      }

      setMessage("配置已保存");
      const nextAdminPath =
        typeof updates.NEXT_PUBLIC_ADMIN_PATH === "string" ? updates.NEXT_PUBLIC_ADMIN_PATH : "";

      if (nextAdminPath && nextAdminPath !== initialAdminPath) {
        window.location.href = nextAdminPath;
      } else {
        await loadSettings();
      }
    } catch (saveError) {
      const msg = saveError instanceof Error ? saveError.message : "保存失败";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  /**
   * 修改管理员账号密码。
   *
   * @param event 表单事件
   */
  const handleChangeCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    if (credentialSaving) {
      return;
    }

    setCredentialSaving(true);
    setCredentialMessage("");
    setCredentialError("");

    try {
      const response = await fetch("/api/admin/security/change-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nextUsername: nextUsername.trim(),
          oldPassword,
          nextPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "修改失败");
      }

      setCredentialMessage("管理员账号密码已更新，请重新登录");
      setNextPassword("");
      setOldPassword("");

      window.setTimeout(() => {
        window.location.href = initialAdminPath;
      }, 1200);
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : "修改失败";
      setCredentialError(msg);
    } finally {
      setCredentialSaving(false);
    }
  };

  /**
   * 渲染配置分组表单。
   *
   * @param title 分组标题
   * @param sectionItems 分组配置项
   * @returns 节点
   */
  const renderSection = (title: string, sectionItems: RuntimeSettingItem[]) => {
    if (sectionItems.length === 0) {
      return null;
    }
    return (
      <section className={styles.settingsSection}>
        <h2 className={styles.settingsSectionTitle}>{title}</h2>
        <div className={styles.settingsFormGrid}>
          {sectionItems.map((item) => (
            <label key={item.key} className={styles.settingsField}>
              <span className={styles.settingsFieldLabel}>{item.label}</span>
              {item.type === "boolean" ? (
                <select
                  className={styles.settingsInput}
                  value={draftValues[item.key] ?? "false"}
                  onChange={(event) => setDraftValue(item.key, event.target.value)}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  className={styles.settingsInput}
                  type={item.type === "number" ? "number" : "text"}
                  value={draftValues[item.key] ?? ""}
                  onChange={(event) => setDraftValue(item.key, event.target.value)}
                />
              )}
              <span className={styles.settingsFieldKey}>{item.key}</span>
              <span className={styles.settingsFieldDesc}>{item.description}</span>
            </label>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.settingsRoot}>
      <div className={styles.settingsHeader}>
        <h1 className={styles.settingsTitle}>设置中心</h1>
        <p className={styles.settingsSubtitle}>支持在线编辑运行时配置与管理员安全设置。</p>
      </div>

      {loading ? <div className={styles.settingsHint}>加载中...</div> : null}
      {error ? <div className={styles.settingsError}>{error}</div> : null}
      {message ? <div className={styles.settingsSuccess}>{message}</div> : null}

      {!loading && (
        <>
          {renderSection("站点配置", groupedItems.site)}
          {renderSection("博客配置", groupedItems.blog)}
          {renderSection("国际化配置", groupedItems.i18n)}
          {renderSection("资料与页脚配置", groupedItems.profile)}
          {renderSection("系统配置", groupedItems.system)}

          <section className={styles.settingsSection}>
            <h2 className={styles.settingsSectionTitle}>管理员安全</h2>
            <form className={styles.settingsFormGrid} onSubmit={handleChangeCredentials}>
              <label className={styles.settingsField}>
                <span className={styles.settingsFieldLabel}>新用户名</span>
                <input
                  className={styles.settingsInput}
                  type="text"
                  value={nextUsername}
                  onChange={(event) => setNextUsername(event.target.value)}
                />
              </label>
              <label className={styles.settingsField}>
                <span className={styles.settingsFieldLabel}>旧密码</span>
                <input
                  className={styles.settingsInput}
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  required
                />
              </label>
              <label className={styles.settingsField}>
                <span className={styles.settingsFieldLabel}>新密码</span>
                <input
                  className={styles.settingsInput}
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  required
                />
              </label>
              <div className={styles.settingsActions}>
                <button className={styles.settingsPrimaryButton} type="submit" disabled={credentialSaving}>
                  {credentialSaving ? "提交中..." : "更新账号密码"}
                </button>
                {credentialError ? <span className={styles.settingsErrorInline}>{credentialError}</span> : null}
                {credentialMessage ? <span className={styles.settingsSuccessInline}>{credentialMessage}</span> : null}
              </div>
            </form>
          </section>

          <div className={styles.settingsFooterActions}>
            <button className={styles.settingsPrimaryButton} type="button" onClick={handleSaveSettings} disabled={saving}>
              {saving ? "保存中..." : "保存全部配置"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsClientCore;
