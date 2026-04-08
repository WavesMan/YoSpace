import React from "react";
import styles from "./SettingsPage.module.css";

interface SettingItem {
  key: string;
  label: string;
  value: string;
  secret?: boolean;
}

/**
 * 对敏感配置进行脱敏展示
 *
 * @param value 原始配置值
 * @returns 脱敏后的文本
 */
function maskSensitiveValue(value: string): string {
  if (!value) {
    return "(未配置)";
  }
  if (value.length <= 6) {
    return "******";
  }
  return `${value.slice(0, 3)}******${value.slice(-3)}`;
}

/**
 * 渲染配置分组
 *
 * @param title 分组标题
 * @param items 配置项列表
 * @returns 分组节点
 */
function renderSection(title: string, items: SettingItem[]) {
  return (
    <section className={styles.settingsSection}>
      <h2 className={styles.settingsSectionTitle}>{title}</h2>
      <div className={styles.settingsTableWrap}>
        <table className={styles.settingsTable}>
          <thead>
            <tr>
              <th>配置键</th>
              <th>说明</th>
              <th>当前值</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key}>
                <td className={styles.settingsCellCode}>{item.key}</td>
                <td>{item.label}</td>
                <td className={styles.settingsCellValue}>
                  {item.secret ? maskSensitiveValue(item.value) : item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * 后台设置中心页面
 *
 * 展示当前运行配置快照，后续可扩展在线编辑与热更新。
 *
 * @returns 设置中心页面 JSX 节点
 */
const AdminSettingsPage = () => {
  const generalSettings: SettingItem[] = [
    {
      key: "NEXT_PUBLIC_SITE_TITLE",
      label: "站点标题",
      value: process.env.NEXT_PUBLIC_SITE_TITLE || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_SITE_URL",
      label: "站点地址",
      value: process.env.NEXT_PUBLIC_SITE_URL || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_NAV_TITLE",
      label: "导航标题",
      value: process.env.NEXT_PUBLIC_NAV_TITLE || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_FAVICON_URL",
      label: "Favicon 地址",
      value: process.env.NEXT_PUBLIC_FAVICON_URL || "(未配置)",
    },
  ];

  const blogSettings: SettingItem[] = [
    {
      key: "NEXT_PUBLIC_BLOG_MODE",
      label: "博客模式",
      value: process.env.NEXT_PUBLIC_BLOG_MODE || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_BLOG_URL",
      label: "外部博客地址",
      value: process.env.NEXT_PUBLIC_BLOG_URL || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE",
      label: "每页文章数",
      value: process.env.NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE || "(未配置)",
    },
    {
      key: "NEXT_PUBLIC_USE_DB_CONTENT",
      label: "数据库内容源开关",
      value: process.env.NEXT_PUBLIC_USE_DB_CONTENT || "(未配置)",
    },
  ];

  const securitySettings: SettingItem[] = [
    {
      key: "ADMIN_USERNAME",
      label: "管理员账号",
      value: process.env.ADMIN_USERNAME || "(未配置)",
    },
    {
      key: "ADMIN_PASSWORD",
      label: "管理员密码",
      value: process.env.ADMIN_PASSWORD || "",
      secret: true,
    },
    {
      key: "ADMIN_JWT_SECRET",
      label: "管理员 JWT 密钥",
      value: process.env.ADMIN_JWT_SECRET || "",
      secret: true,
    },
  ];

  return (
    <div className={styles.settingsRoot}>
      <div className={styles.settingsHeader}>
        <h1 className={styles.settingsTitle}>设置中心</h1>
        <p className={styles.settingsSubtitle}>当前为只读运行配置快照，后续可接入在线编辑能力。</p>
      </div>
      {renderSection("站点设置", generalSettings)}
      {renderSection("博客设置", blogSettings)}
      {renderSection("管理员安全", securitySettings)}
    </div>
  );
};

export default AdminSettingsPage;