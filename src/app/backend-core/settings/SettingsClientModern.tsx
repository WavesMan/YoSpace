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
 * 将配置值统一转为可编辑字符串。
 *
 * @param value 原始配置值
 * @returns 输入框可用字符串
 */
function toInputValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

/**
 * 按类型将输入字符串转回配置值。
 *
 * @param type 配置类型
 * @param raw 原始字符串
 * @returns 类型化后的值
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
 * 判断两个配置值是否等价。
 *
 * @param type 配置类型
 * @param left 左值
 * @param right 右值
 * @returns 是否等价
 */
function isSameValue(type: RuntimeConfigType, left: string, right: string | number | boolean): boolean {
  const parsedLeft = parseInputValue(type, left);
  return String(parsedLeft) === String(right);
}

/**
 * 现代化设置中心客户端。
 *
 * @param props 组件参数
 * @returns 设置中心页面
 */
const SettingsClientModern: React.FC<SettingsClientProps> = ({ initialAdminPath }) => {
  const [items, setItems] = useState<RuntimeSettingItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [nextUsername, setNextUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialMessage, setCredentialMessage] = useState("");
  const [credentialError, setCredentialError] = useState("");

  /**
   * 拉取设置项。
   */
  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "加载设置失败");
      }
      const list = (data?.items || []) as RuntimeSettingItem[];
      setItems(list);
      setDraftValues(Object.fromEntries(list.map((item) => [item.key, toInputValue(item.value)])));
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "加载设置失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(keyword) ||
        item.label.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword),
    );
  }, [items, searchKeyword]);

  const groupedItems = useMemo(() => {
    const site = filteredItems.filter(
      (item) => item.key.startsWith("NEXT_PUBLIC_SITE_") || item.key.startsWith("NEXT_PUBLIC_NAV_"),
    );
    const blog = filteredItems.filter(
      (item) => item.key.startsWith("NEXT_PUBLIC_BLOG_") || item.key === "NEXT_PUBLIC_USE_DB_CONTENT",
    );
    const i18n = filteredItems.filter(
      (item) =>
        item.key === "NEXT_PUBLIC_I18N" ||
        item.key === "NEXT_PUBLIC_DEFAULT_LOCALE" ||
        item.key === "NEXT_PUBLIC_SUPPORTED_LOCALES",
    );
    const profile = filteredItems.filter(
      (item) =>
        item.key.startsWith("NEXT_PUBLIC_PROFILE_") ||
        item.key === "NEXT_PUBLIC_FAVICON_URL" ||
        item.key === "NEXT_PUBLIC_ICP_CODE" ||
        item.key === "NEXT_PUBLIC_POLICE_LICENSE",
    );
    const system = filteredItems.filter(
      (item) =>
        item.key === "NEXT_PUBLIC_ADMIN_PATH" ||
        item.key === "NEXT_PUBLIC_MUSIC_API_BASE" ||
        item.key === "NEXT_PUBLIC_MUSIC_PLAYLIST_ID" ||
        item.key === "NEXT_PUBLIC_RSS_FEED_PATH" ||
        item.key === "NEXT_PUBLIC_ATOM_FEED_PATH",
    );
    return { site, blog, i18n, profile, system };
  }, [filteredItems]);

  const stats = useMemo(() => {
    const publicCount = items.filter((item) => item.isPublic).length;
    const privateCount = items.length - publicCount;
    const changedCount = items.reduce((count, item) => {
      const draft = draftValues[item.key] ?? toInputValue(item.value);
      return isSameValue(item.type, draft, item.value) ? count : count + 1;
    }, 0);
    return { total: items.length, publicCount, privateCount, changedCount };
  }, [items, draftValues]);

  /**
   * 更新草稿值。
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "保存失败");
      }

      setMessage("配置保存成功");
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
   * 提交管理员凭证修改。
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
        headers: { "Content-Type": "application/json" },
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
   * 渲染配置分组。
   *
   * @param title 分组标题
   * @param sectionItems 分组项
   * @returns 分组节点
   */
  const renderSection = (title: string, sectionItems: RuntimeSettingItem[]) => {
    if (sectionItems.length === 0) {
      return null;
    }

    return (
      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <h2 className={styles.settingsSectionTitle}>{title}</h2>
          <span className={styles.settingsSectionCount}>{sectionItems.length} 项</span>
        </div>
        <div className={styles.settingsFormGrid}>
          {sectionItems.map((item) => {
            const draftValue = draftValues[item.key] ?? "";
            const changed = !isSameValue(item.type, draftValue, item.value);
            return (
              <label key={item.key} className={`${styles.settingsField} ${changed ? styles.settingsFieldChanged : ""}`}>
                <div className={styles.settingsFieldTop}>
                  <span className={styles.settingsFieldLabel}>{item.label}</span>
                  <span className={item.isPublic ? styles.settingsTagPublic : styles.settingsTagPrivate}>
                    {item.isPublic ? "公开" : "内部"}
                  </span>
                </div>
                {item.type === "boolean" ? (
                  <select
                    className={styles.settingsInput}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    className={styles.settingsInput}
                    type={item.type === "number" ? "number" : "text"}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  />
                )}
                <span className={styles.settingsFieldDesc}>{item.description}</span>
                <span className={styles.settingsFieldKey}>{item.key}</span>
              </label>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.settingsRoot}>
      <div className={styles.settingsHero}>
        <div className={styles.settingsHeader}>
          <h1 className={styles.settingsTitle}>设置中心</h1>
          <p className={styles.settingsSubtitle}>统一管理运行时配置、后台入口与管理员安全项。</p>
        </div>
        <div className={styles.settingsStats}>
          <div className={styles.settingsStatCard}>
            <span className={styles.settingsStatLabel}>总配置</span>
            <strong className={styles.settingsStatValue}>{stats.total}</strong>
          </div>
          <div className={styles.settingsStatCard}>
            <span className={styles.settingsStatLabel}>公开项</span>
            <strong className={styles.settingsStatValue}>{stats.publicCount}</strong>
          </div>
          <div className={styles.settingsStatCard}>
            <span className={styles.settingsStatLabel}>内部项</span>
            <strong className={styles.settingsStatValue}>{stats.privateCount}</strong>
          </div>
          <div className={styles.settingsStatCard}>
            <span className={styles.settingsStatLabel}>待保存</span>
            <strong className={styles.settingsStatValue}>{stats.changedCount}</strong>
          </div>
        </div>
      </div>

      <div className={styles.settingsToolbar}>
        <input
          className={styles.settingsSearch}
          type="text"
          value={searchKeyword}
          placeholder="搜索配置键、名称或说明"
          onChange={(event) => setSearchKeyword(event.target.value)}
        />
        <button className={styles.settingsPrimaryButton} type="button" onClick={handleSaveSettings} disabled={saving || loading}>
          {saving ? "保存中..." : `保存配置${stats.changedCount > 0 ? ` (${stats.changedCount})` : ""}`}
        </button>
      </div>

      {loading ? <div className={styles.settingsHint}>正在加载配置...</div> : null}
      {error ? <div className={styles.settingsError}>{error}</div> : null}
      {message ? <div className={styles.settingsSuccess}>{message}</div> : null}

      {!loading && (
        <>
          {renderSection("站点配置", groupedItems.site)}
          {renderSection("博客配置", groupedItems.blog)}
          {renderSection("国际化配置", groupedItems.i18n)}
          {renderSection("资料与页脚", groupedItems.profile)}
          {renderSection("系统配置", groupedItems.system)}

          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHeader}>
              <h2 className={styles.settingsSectionTitle}>管理员安全</h2>
              <span className={styles.settingsSectionCount}>敏感操作</span>
            </div>
            <form className={styles.settingsFormGrid} onSubmit={handleChangeCredentials}>
              <label className={styles.settingsField}>
                <span className={styles.settingsFieldLabel}>新用户名</span>
                <input
                  className={styles.settingsInput}
                  type="text"
                  value={nextUsername}
                  onChange={(event) => setNextUsername(event.target.value)}
                />
                <span className={styles.settingsFieldDesc}>不填写则保持当前用户名。</span>
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
        </>
      )}
    </div>
  );
};

export default SettingsClientModern;
