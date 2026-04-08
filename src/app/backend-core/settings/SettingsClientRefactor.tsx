"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./SettingsRefactor.module.css";

type RuntimeConfigType = "string" | "number" | "boolean";
type SettingsGroupKey = "site" | "blog" | "i18n" | "profile" | "system";
type SidebarFilter = "all" | SettingsGroupKey | "security";

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

interface SettingsGroupMeta {
  key: SettingsGroupKey;
  title: string;
  description: string;
}

const SETTINGS_GROUP_META: SettingsGroupMeta[] = [
  { key: "site", title: "站点配置", description: "标题、描述、导航、品牌展示" },
  { key: "blog", title: "博客配置", description: "博客模式、分页、列表策略" },
  { key: "i18n", title: "国际化配置", description: "语言开关、默认语言、支持语言" },
  { key: "profile", title: "资料与页脚", description: "头像、资料、备案与页脚信息" },
  { key: "system", title: "系统配置", description: "后台入口、订阅、音乐等系统项" },
];

/**
 * 将配置值转换为可编辑字符串。
 *
 * @param value 原始配置值
 * @returns 输入框字符串值
 */
function toInputValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

/**
 * 按配置类型解析输入字符串。
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
 * 判断草稿值与原值是否一致。
 *
 * @param type 配置类型
 * @param left 草稿字符串
 * @param right 原始值
 * @returns 是否一致
 */
function isSameValue(type: RuntimeConfigType, left: string, right: string | number | boolean): boolean {
  return String(parseInputValue(type, left)) === String(right);
}

/**
 * 根据配置键推断分组。
 *
 * @param item 配置项
 * @returns 分组键
 */
function resolveGroupKey(item: RuntimeSettingItem): SettingsGroupKey {
  if (item.key.startsWith("NEXT_PUBLIC_SITE_") || item.key.startsWith("NEXT_PUBLIC_NAV_")) {
    return "site";
  }
  if (item.key.startsWith("NEXT_PUBLIC_BLOG_") || item.key === "NEXT_PUBLIC_USE_DB_CONTENT") {
    return "blog";
  }
  if (
    item.key === "NEXT_PUBLIC_I18N" ||
    item.key === "NEXT_PUBLIC_DEFAULT_LOCALE" ||
    item.key === "NEXT_PUBLIC_SUPPORTED_LOCALES"
  ) {
    return "i18n";
  }
  if (
    item.key.startsWith("NEXT_PUBLIC_PROFILE_") ||
    item.key === "NEXT_PUBLIC_FAVICON_URL" ||
    item.key === "NEXT_PUBLIC_ICP_CODE" ||
    item.key === "NEXT_PUBLIC_POLICE_LICENSE"
  ) {
    return "profile";
  }
  return "system";
}

/**
 * 设置中心重构版客户端页面。
 *
 * @param props 组件参数
 * @returns 设置中心页面
 */
const SettingsClientRefactor: React.FC<SettingsClientProps> = ({ initialAdminPath }) => {
  const [items, setItems] = useState<RuntimeSettingItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [nextUsername, setNextUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialMessage, setCredentialMessage] = useState("");
  const [credentialError, setCredentialError] = useState("");

  /**
   * 拉取全部配置项。
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

  const searchedItems = useMemo(() => {
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
    const groupMap: Record<SettingsGroupKey, RuntimeSettingItem[]> = {
      site: [],
      blog: [],
      i18n: [],
      profile: [],
      system: [],
    };
    for (const item of searchedItems) {
      groupMap[resolveGroupKey(item)].push(item);
    }
    return groupMap;
  }, [searchedItems]);

  const stats = useMemo(() => {
    const publicCount = items.filter((item) => item.isPublic).length;
    const privateCount = items.length - publicCount;
    const changedCount = items.reduce((count, item) => {
      const draft = draftValues[item.key] ?? toInputValue(item.value);
      return isSameValue(item.type, draft, item.value) ? count : count + 1;
    }, 0);
    return {
      total: items.length,
      publicCount,
      privateCount,
      changedCount,
    };
  }, [items, draftValues]);

  const filterCounts = useMemo(() => {
    return {
      all: searchedItems.length,
      site: groupedItems.site.length,
      blog: groupedItems.blog.length,
      i18n: groupedItems.i18n.length,
      profile: groupedItems.profile.length,
      system: groupedItems.system.length,
      security: 1,
    };
  }, [searchedItems.length, groupedItems]);

  /**
   * 更新草稿输入值。
   *
   * @param key 配置键
   * @param value 输入值
   */
  const setDraftValue = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * 保存配置到服务端。
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
   * 还原本地草稿。
   */
  const handleResetDraft = () => {
    setDraftValues(Object.fromEntries(items.map((item) => [item.key, toInputValue(item.value)])));
    setMessage("已还原到当前已保存版本");
    setError("");
  };

  /**
   * 修改管理员凭证。
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
   * 渲染单个配置分组。
   *
   * @param group 分组元信息
   * @returns 分组节点
   */
  const renderGroupSection = (group: SettingsGroupMeta) => {
    const sectionItems = groupedItems[group.key];
    if (sectionItems.length === 0) {
      return null;
    }
    if (activeFilter !== "all" && activeFilter !== group.key) {
      return null;
    }

    return (
      <section className={styles.settingsSection} key={group.key}>
        <div className={styles.settingsSectionHeader}>
          <div>
            <h2 className={styles.settingsSectionTitle}>{group.title}</h2>
            <p className={styles.settingsSectionDesc}>{group.description}</p>
          </div>
          <span className={styles.settingsSectionCount}>{sectionItems.length} 项</span>
        </div>

        <div className={styles.settingsConfigGrid}>
          {sectionItems.map((item) => {
            const draftValue = draftValues[item.key] ?? "";
            const changed = !isSameValue(item.type, draftValue, item.value);
            return (
              <label
                key={item.key}
                className={`${styles.settingsConfigCard} ${changed ? styles.settingsConfigCardChanged : ""}`}
              >
                <div className={styles.settingsConfigHead}>
                  <span className={styles.settingsConfigLabel}>{item.label}</span>
                  <span className={item.isPublic ? styles.settingsScopePublic : styles.settingsScopePrivate}>
                    {item.isPublic ? "公开" : "内部"}
                  </span>
                </div>

                {item.type === "boolean" ? (
                  <select
                    className={styles.settingsConfigInput}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    className={styles.settingsConfigInput}
                    type={item.type === "number" ? "number" : "text"}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  />
                )}

                <span className={styles.settingsConfigDesc}>{item.description}</span>
                <span className={styles.settingsConfigKey}>{item.key}</span>
              </label>
            );
          })}
        </div>
      </section>
    );
  };

  const showSecuritySection = activeFilter === "all" || activeFilter === "security";

  return (
    <div className={styles.settingsRoot}>
      <div className={styles.settingsShell}>
        <aside className={styles.settingsSidebar}>
          <div className={styles.settingsSidebarSticky}>
            <section className={styles.settingsBrandCard}>
              <h1 className={styles.settingsBrandTitle}>设置中心</h1>
              <p className={styles.settingsBrandDesc}>运行时配置与后台安全统一管理入口。</p>
              <div className={styles.settingsStatGrid}>
                <div className={styles.settingsStatCard}>
                  <span className={styles.settingsStatLabel}>总配置</span>
                  <strong className={styles.settingsStatValue}>{stats.total}</strong>
                </div>
                <div className={styles.settingsStatCard}>
                  <span className={styles.settingsStatLabel}>待保存</span>
                  <strong className={styles.settingsStatValue}>{stats.changedCount}</strong>
                </div>
                <div className={styles.settingsStatCard}>
                  <span className={styles.settingsStatLabel}>公开</span>
                  <strong className={styles.settingsStatValue}>{stats.publicCount}</strong>
                </div>
                <div className={styles.settingsStatCard}>
                  <span className={styles.settingsStatLabel}>内部</span>
                  <strong className={styles.settingsStatValue}>{stats.privateCount}</strong>
                </div>
              </div>
            </section>

            <nav className={styles.settingsFilterNav}>
              <button
                type="button"
                className={`${styles.settingsFilterButton} ${activeFilter === "all" ? styles.settingsFilterButtonActive : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <span>全部配置</span>
                <span className={styles.settingsFilterCount}>{filterCounts.all}</span>
              </button>
              {SETTINGS_GROUP_META.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  className={`${styles.settingsFilterButton} ${activeFilter === group.key ? styles.settingsFilterButtonActive : ""}`}
                  onClick={() => setActiveFilter(group.key)}
                >
                  <span>{group.title}</span>
                  <span className={styles.settingsFilterCount}>{filterCounts[group.key]}</span>
                </button>
              ))}
              <button
                type="button"
                className={`${styles.settingsFilterButton} ${activeFilter === "security" ? styles.settingsFilterButtonActive : ""}`}
                onClick={() => setActiveFilter("security")}
              >
                <span>管理员安全</span>
                <span className={styles.settingsFilterCount}>{filterCounts.security}</span>
              </button>
            </nav>
          </div>
        </aside>

        <section className={styles.settingsContent}>
          <div className={styles.settingsTopbar}>
            <div className={styles.settingsTopText}>
              <h2 className={styles.settingsTopTitle}>动态配置编辑器</h2>
              <p className={styles.settingsTopDesc}>支持即时保存；修改后台入口后会自动跳转至新地址。</p>
            </div>
            <div className={styles.settingsTopActions}>
              <input
                className={styles.settingsSearch}
                type="text"
                value={searchKeyword}
                placeholder="搜索配置键、名称、说明"
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
              <button className={styles.settingsSecondaryButton} type="button" onClick={handleResetDraft} disabled={loading || saving}>
                还原草稿
              </button>
              <button className={styles.settingsPrimaryButton} type="button" onClick={handleSaveSettings} disabled={loading || saving}>
                {saving ? "保存中..." : `保存配置${stats.changedCount > 0 ? ` (${stats.changedCount})` : ""}`}
              </button>
            </div>
          </div>

          {loading ? <div className={styles.settingsBanner}>正在加载配置...</div> : null}
          {error ? <div className={`${styles.settingsBanner} ${styles.settingsBannerError}`}>{error}</div> : null}
          {message ? <div className={`${styles.settingsBanner} ${styles.settingsBannerSuccess}`}>{message}</div> : null}

          {!loading && (
            <>
              {SETTINGS_GROUP_META.map((group) => renderGroupSection(group))}

              {showSecuritySection && (
                <section className={styles.settingsSection}>
                  <div className={styles.settingsSectionHeader}>
                    <div>
                      <h2 className={styles.settingsSectionTitle}>管理员安全</h2>
                      <p className={styles.settingsSectionDesc}>修改账号密码后，当前会话会失效并重新登录。</p>
                    </div>
                    <span className={styles.settingsSectionCount}>敏感操作</span>
                  </div>

                  <form className={styles.settingsConfigGrid} onSubmit={handleChangeCredentials}>
                    <label className={styles.settingsConfigCard}>
                      <span className={styles.settingsConfigLabel}>新用户名</span>
                      <input
                        className={styles.settingsConfigInput}
                        type="text"
                        value={nextUsername}
                        onChange={(event) => setNextUsername(event.target.value)}
                      />
                      <span className={styles.settingsConfigDesc}>可选，不填写则保持当前用户名。</span>
                    </label>

                    <label className={styles.settingsConfigCard}>
                      <span className={styles.settingsConfigLabel}>旧密码</span>
                      <input
                        className={styles.settingsConfigInput}
                        type="password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        required
                      />
                    </label>

                    <label className={styles.settingsConfigCard}>
                      <span className={styles.settingsConfigLabel}>新密码</span>
                      <input
                        className={styles.settingsConfigInput}
                        type="password"
                        value={nextPassword}
                        onChange={(event) => setNextPassword(event.target.value)}
                        required
                      />
                    </label>

                    <div className={styles.settingsSecurityActions}>
                      <button className={styles.settingsPrimaryButton} type="submit" disabled={credentialSaving}>
                        {credentialSaving ? "提交中..." : "更新账号密码"}
                      </button>
                      {credentialError ? (
                        <span className={`${styles.settingsInlineMessage} ${styles.settingsInlineError}`}>{credentialError}</span>
                      ) : null}
                      {credentialMessage ? (
                        <span className={`${styles.settingsInlineMessage} ${styles.settingsInlineSuccess}`}>{credentialMessage}</span>
                      ) : null}
                    </div>
                  </form>
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsClientRefactor;
