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

interface ConfigTextMeta {
  label: string;
  description: string;
}

interface EnumOption {
  value: string;
  label: string;
}

const SETTINGS_GROUP_META: SettingsGroupMeta[] = [
  { key: "site", title: "站点配置", description: "标题、描述、导航与品牌展示" },
  { key: "blog", title: "博客配置", description: "博客模式、分页与列表展示策略" },
  { key: "i18n", title: "国际化配置", description: "语言开关、默认语言与支持范围" },
  { key: "profile", title: "资料与页脚", description: "头像、资料、备案与页脚信息" },
  { key: "system", title: "系统配置", description: "后台入口、订阅与音乐播放器" },
];

const CONFIG_TEXT_MAP: Record<string, ConfigTextMeta> = {
  NEXT_PUBLIC_SITE_TITLE: { label: "站点标题", description: "浏览器与页面默认中文标题" },
  NEXT_PUBLIC_SITE_TITLE_EN: { label: "站点标题（英文）", description: "英文语言下的站点标题" },
  NEXT_PUBLIC_SITE_DESCRIPTION: { label: "站点描述", description: "站点默认中文描述" },
  NEXT_PUBLIC_SITE_DESCRIPTION_EN: { label: "站点描述（英文）", description: "英文语言下的站点描述" },
  NEXT_PUBLIC_SITE_URL: { label: "站点地址", description: "用于 SEO、Feed 与绝对链接生成" },
  NEXT_PUBLIC_NAV_TITLE: { label: "导航标题", description: "顶部导航显示的中文标题" },
  NEXT_PUBLIC_NAV_TITLE_EN: { label: "导航标题（英文）", description: "英文语言下导航显示标题" },
  NEXT_PUBLIC_I18N: { label: "启用国际化", description: "是否开启中英双语切换" },
  NEXT_PUBLIC_DEFAULT_LOCALE: { label: "默认语言", description: "未命中用户偏好时采用的语言" },
  NEXT_PUBLIC_SUPPORTED_LOCALES: { label: "支持语言列表", description: "逗号分隔，例如 zh-CN,en-US" },
  NEXT_PUBLIC_PROFILE_NAMES: { label: "资料姓名（中文）", description: "首页资料区显示名称，逗号分隔" },
  NEXT_PUBLIC_PROFILE_NAMES_EN: { label: "资料姓名（英文）", description: "英文语言下资料显示名称" },
  NEXT_PUBLIC_PROFILE_IMAGE: { label: "资料头像地址", description: "首页资料头像 URL 或本地路径" },
  NEXT_PUBLIC_FAVICON_URL: { label: "站点图标地址", description: "favicon 图标地址" },
  NEXT_PUBLIC_BLOG_MODE: { label: "博客模式", description: "站内路由或跳转外部博客" },
  NEXT_PUBLIC_BLOG_URL: { label: "外部博客地址", description: "博客模式为 external 时的跳转地址" },
  NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE: { label: "博客每页数量", description: "列表分页默认条数" },
  NEXT_PUBLIC_BLOG_CATEGORY_ENABLED: { label: "显示分类", description: "是否显示文章分类信息" },
  NEXT_PUBLIC_BLOG_TAGS_ENABLED: { label: "显示标签", description: "是否显示文章标签信息" },
  NEXT_PUBLIC_BLOG_SERIES_ENABLED: { label: "显示系列", description: "文章详情是否显示系列模块" },
  NEXT_PUBLIC_BLOG_RECOMMEND_ENABLED: { label: "显示推荐", description: "文章详情是否显示推荐模块" },
  NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY: { label: "分类标签策略", description: "分类名称优先级策略" },
  NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE: { label: "标签最大显示数", description: "博客卡片最多展示标签数量" },
  NEXT_PUBLIC_BLOG_CATEGORY_POSITION: { label: "分类显示位置", description: "博客卡片中分类展示位置" },
  NEXT_PUBLIC_BLOG_PINNED_STYLE: { label: "置顶展示样式", description: "置顶文章是否单独分区展示" },
  NEXT_PUBLIC_BLOG_RELATED_LIMIT: { label: "关联文章上限", description: "详情页关联文章计算的拉取上限" },
  NEXT_PUBLIC_MUSIC_API_BASE: { label: "音乐 API 地址", description: "音乐播放器数据接口地址" },
  NEXT_PUBLIC_MUSIC_PLAYLIST_ID: { label: "音乐歌单 ID", description: "全站默认歌单 ID" },
  NEXT_PUBLIC_RSS_FEED_PATH: { label: "RSS 路径", description: "RSS 订阅地址路径" },
  NEXT_PUBLIC_ATOM_FEED_PATH: { label: "ATOM 路径", description: "ATOM 订阅地址路径" },
  NEXT_PUBLIC_ICP_CODE: { label: "ICP 备案号", description: "页脚工信部备案号" },
  NEXT_PUBLIC_POLICE_LICENSE: { label: "公安备案号", description: "页脚公安备案号" },
  NEXT_PUBLIC_SITE_NAME: { label: "站点名称", description: "页脚版权名称" },
  NEXT_PUBLIC_SITE_START_YEAR: { label: "站点起始年份", description: "页脚版权起始年份" },
  NEXT_PUBLIC_USE_DB_CONTENT: { label: "启用数据库内容源", description: "博客内容优先从数据库读取" },
  NEXT_PUBLIC_ADMIN_PATH: { label: "后台入口路径", description: "后台统一入口，修改后旧入口失效" },
};

const ENUM_OPTIONS_MAP: Record<string, EnumOption[]> = {
  NEXT_PUBLIC_BLOG_MODE: [
    { value: "internal", label: "站内模式（internal）" },
    { value: "external", label: "外部跳转（external）" },
  ],
  NEXT_PUBLIC_DEFAULT_LOCALE: [
    { value: "zh-CN", label: "中文（zh-CN）" },
    { value: "en-US", label: "英文（en-US）" },
  ],
  NEXT_PUBLIC_BLOG_CATEGORY_LABEL_STRATEGY: [
    { value: "i18n-first", label: "优先多语言标签（i18n-first）" },
    { value: "frontmatter-first", label: "优先 frontmatter（frontmatter-first）" },
  ],
  NEXT_PUBLIC_BLOG_CATEGORY_POSITION: [
    { value: "above-title", label: "标题上方（above-title）" },
    { value: "inline-title", label: "标题前缀（inline-title）" },
    { value: "hidden", label: "隐藏（hidden）" },
  ],
  NEXT_PUBLIC_BLOG_PINNED_STYLE: [
    { value: "separate-section", label: "独立置顶区（separate-section）" },
    { value: "mixed", label: "混合展示（mixed）" },
  ],
};

/**
 * 将配置值转换为可编辑文本。
 * @param value 原始配置值
 * @returns 文本值
 */
function toInputValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

/**
 * 按字段类型解析输入值。
 * @param type 字段类型
 * @param raw 输入文本
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
 * @param type 字段类型
 * @param left 草稿值
 * @param right 原始值
 * @returns 是否一致
 */
function isSameValue(type: RuntimeConfigType, left: string, right: string | number | boolean): boolean {
  return String(parseInputValue(type, left)) === String(right);
}

/**
 * 解析配置项分组。
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
    item.key === "NEXT_PUBLIC_POLICE_LICENSE" ||
    item.key === "NEXT_PUBLIC_SITE_NAME" ||
    item.key === "NEXT_PUBLIC_SITE_START_YEAR"
  ) {
    return "profile";
  }
  return "system";
}

/**
 * 获取配置项中文文本。
 * @param item 配置项
 * @returns 显示文本
 */
function resolveConfigText(item: RuntimeSettingItem): ConfigTextMeta {
  const translated = CONFIG_TEXT_MAP[item.key];
  if (translated) {
    return translated;
  }
  return {
    label: item.label || item.key,
    description: item.description || "暂无描述",
  };
}

/**
 * 获取选择项列表；当前值不在预设中时自动补入。
 * @param item 配置项
 * @param draftValue 当前草稿值
 * @returns 选项列表
 */
function resolveSelectOptions(item: RuntimeSettingItem, draftValue: string): EnumOption[] {
  if (item.type === "boolean") {
    return [
      { value: "true", label: "开启（true）" },
      { value: "false", label: "关闭（false）" },
    ];
  }

  const options = ENUM_OPTIONS_MAP[item.key];
  if (!options) {
    return [];
  }
  if (!options.some((option) => option.value === draftValue)) {
    return [{ value: draftValue, label: `当前值（${draftValue}）` }, ...options];
  }
  return options;
}

/**
 * 设置中心（转译与枚举版）。
 * @param props 组件参数
 * @returns 设置中心页面
 */
const SettingsClientTranslated: React.FC<SettingsClientProps> = ({ initialAdminPath }) => {
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
   * 拉取后台配置。
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
    return items.filter((item) => {
      const text = resolveConfigText(item);
      return (
        item.key.toLowerCase().includes(keyword) ||
        text.label.toLowerCase().includes(keyword) ||
        text.description.toLowerCase().includes(keyword)
      );
    });
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
    return { total: items.length, publicCount, privateCount, changedCount };
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
   * 更新草稿值。
   * @param key 配置键
   * @param value 草稿值
   */
  const setDraftValue = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * 保存所有配置。
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
      const nextAdminPath = typeof updates.NEXT_PUBLIC_ADMIN_PATH === "string" ? updates.NEXT_PUBLIC_ADMIN_PATH : "";
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
   * 恢复草稿到已保存值。
   */
  const handleResetDraft = () => {
    setDraftValues(Object.fromEntries(items.map((item) => [item.key, toInputValue(item.value)])));
    setMessage("已恢复为当前已保存配置");
    setError("");
  };

  /**
   * 提交管理员账号密码变更。
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
      setCredentialMessage("账号密码已更新，请重新登录");
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
   * 渲染分组配置区域。
   * @param group 分组信息
   * @returns JSX 节点
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
            const displayText = resolveConfigText(item);
            const draftValue = draftValues[item.key] ?? "";
            const changed = !isSameValue(item.type, draftValue, item.value);
            const selectOptions = resolveSelectOptions(item, draftValue);
            const useSelect = item.type === "boolean" || selectOptions.length > 0;

            return (
              <label
                key={item.key}
                className={`${styles.settingsConfigCard} ${changed ? styles.settingsConfigCardChanged : ""}`}
              >
                <div className={styles.settingsConfigHead}>
                  <span className={styles.settingsConfigLabel}>{displayText.label}</span>
                  <span className={item.isPublic ? styles.settingsScopePublic : styles.settingsScopePrivate}>
                    {item.isPublic ? "公开" : "内部"}
                  </span>
                </div>

                {useSelect ? (
                  <select
                    className={styles.settingsConfigInput}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  >
                    {selectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={styles.settingsConfigInput}
                    type={item.type === "number" ? "number" : "text"}
                    value={draftValue}
                    onChange={(event) => setDraftValue(item.key, event.target.value)}
                  />
                )}

                <span className={styles.settingsConfigDesc}>{displayText.description}</span>
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
              <p className={styles.settingsTopDesc}>关键配置采用下拉选择，降低误填风险并提升一致性。</p>
            </div>
            <div className={styles.settingsTopActions}>
              <input
                className={styles.settingsSearch}
                type="text"
                value={searchKeyword}
                placeholder="搜索配置键、字段名或描述"
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

export default SettingsClientTranslated;
