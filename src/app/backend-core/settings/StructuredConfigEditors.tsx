"use client";

import React, { useMemo, useState } from "react";
import styles from "./SettingsRefactor.module.css";

interface NavigationItem {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  desc: {
    zh: string;
    en: string;
  };
  url: string;
  favicon?: {
    type: "auto" | "url" | "local";
    value?: string;
  };
}

interface FriendLinkItem {
  title: string;
  subtitle?: string;
  link: string;
  avatar: string;
}

interface StructuredEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
}

interface StructuredConfigEditorProps extends StructuredEditorProps {
  configKey: string;
}

interface ParsedListResult<T> {
  items: T[];
  error: string;
}

type StructuredEditorKind = "navigation" | "friend-links";

const STRUCTURED_KEYS = new Set<string>([
  "NEXT_PUBLIC_NAVIGATION_ITEMS",
  "NEXT_PUBLIC_FRIEND_LINKS",
]);

/**
 * 判断配置键是否由结构化编辑器托管。
 *
 * @param configKey 配置键
 * @returns 是否结构化配置
 */
export function isStructuredConfigKey(configKey: string): boolean {
  return STRUCTURED_KEYS.has(configKey);
}

/**
 * 根据配置键解析编辑器类型。
 *
 * @param configKey 配置键
 * @returns 编辑器类型
 */
function resolveStructuredEditorKind(configKey: string): StructuredEditorKind | null {
  if (configKey === "NEXT_PUBLIC_NAVIGATION_ITEMS") {
    return "navigation";
  }
  if (configKey === "NEXT_PUBLIC_FRIEND_LINKS") {
    return "friend-links";
  }
  return null;
}

/**
 * 安全解析 JSON 数组。
 *
 * @param raw 原始 JSON 字符串
 * @returns 解析结果
 */
function parseJsonArray(raw: string): { array: unknown[] | null; error: string } {
  if (!raw.trim()) {
    return { array: [], error: "" };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return { array: null, error: "当前值不是 JSON 数组，已使用空列表展示。" };
    }
    return { array: parsed, error: "" };
  } catch {
    return { array: null, error: "当前值 JSON 格式无效，已使用空列表展示。" };
  }
}

/**
 * 将对象数组序列化为字符串。
 *
 * @param list 列表数据
 * @returns JSON 字符串
 */
function toJson(list: unknown[]): string {
  return JSON.stringify(list);
}

/**
 * 解析导航配置列表。
 *
 * @param raw 原始 JSON 字符串
 * @returns 结构化导航列表
 */
function parseNavigationItems(raw: string): ParsedListResult<NavigationItem> {
  const { array, error } = parseJsonArray(raw);
  if (!array) {
    return { items: [], error };
  }

  const items: NavigationItem[] = [];
  for (const item of array) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const nameRaw = record.name as Record<string, unknown> | undefined;
    const descRaw = record.desc as Record<string, unknown> | undefined;
    const faviconRaw = record.favicon as Record<string, unknown> | undefined;
    items.push({
      id: typeof record.id === "string" ? record.id : "",
      name: {
        zh: typeof nameRaw?.zh === "string" ? nameRaw.zh : "",
        en: typeof nameRaw?.en === "string" ? nameRaw.en : "",
      },
      desc: {
        zh: typeof descRaw?.zh === "string" ? descRaw.zh : "",
        en: typeof descRaw?.en === "string" ? descRaw.en : "",
      },
      url: typeof record.url === "string" ? record.url : "",
      favicon: {
        type:
          faviconRaw?.type === "url" || faviconRaw?.type === "local"
            ? (faviconRaw.type as "url" | "local")
            : "auto",
        value: typeof faviconRaw?.value === "string" ? faviconRaw.value : "",
      },
    });
  }

  return { items, error };
}

/**
 * 解析友链配置列表。
 *
 * @param raw 原始 JSON 字符串
 * @returns 结构化友链列表
 */
function parseFriendLinks(raw: string): ParsedListResult<FriendLinkItem> {
  const { array, error } = parseJsonArray(raw);
  if (!array) {
    return { items: [], error };
  }

  const items: FriendLinkItem[] = [];
  for (const item of array) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    items.push({
      title: typeof record.title === "string" ? record.title : "",
      subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
      link: typeof record.link === "string" ? record.link : "",
      avatar: typeof record.avatar === "string" ? record.avatar : "",
    });
  }
  return { items, error };
}

/**
 * 导航配置编辑器主体。
 *
 * @param props 组件参数
 * @returns 编辑节点
 */
function NavigationItemsEditorBody({ value, onChange }: StructuredEditorProps) {
  const parsed = useMemo(() => parseNavigationItems(value), [value]);

  /**
   * 提交导航列表变更。
   *
   * @param nextItems 新的导航列表
   */
  const commit = (nextItems: NavigationItem[]) => {
    onChange(toJson(nextItems));
  };

  return (
    <div className={styles.structuredEditor}>
      {parsed.error ? <div className={styles.structuredEditorHint}>{parsed.error}</div> : null}
      <div className={styles.structuredEditorList}>
        {parsed.items.map((item, index) => (
          <div key={`${item.id || "nav"}-${index}`} className={styles.structuredEditorCard}>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                ID
                <input
                  className={styles.structuredEditorInput}
                  value={item.id}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, id: event.target.value };
                    commit(next);
                  }}
                />
              </label>
              <label className={styles.structuredEditorLabel}>
                URL
                <input
                  className={styles.structuredEditorInput}
                  value={item.url}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, url: event.target.value };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                名称（中）
                <input
                  className={styles.structuredEditorInput}
                  value={item.name.zh}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, name: { ...item.name, zh: event.target.value } };
                    commit(next);
                  }}
                />
              </label>
              <label className={styles.structuredEditorLabel}>
                名称（英）
                <input
                  className={styles.structuredEditorInput}
                  value={item.name.en}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, name: { ...item.name, en: event.target.value } };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                描述（中）
                <input
                  className={styles.structuredEditorInput}
                  value={item.desc.zh}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, desc: { ...item.desc, zh: event.target.value } };
                    commit(next);
                  }}
                />
              </label>
              <label className={styles.structuredEditorLabel}>
                描述（英）
                <input
                  className={styles.structuredEditorInput}
                  value={item.desc.en}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, desc: { ...item.desc, en: event.target.value } };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                图标类型
                <select
                  className={styles.structuredEditorInput}
                  value={item.favicon?.type || "auto"}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = {
                      ...item,
                      favicon: {
                        type: event.target.value as "auto" | "url" | "local",
                        value: item.favicon?.value || "",
                      },
                    };
                    commit(next);
                  }}
                >
                  <option value="auto">auto</option>
                  <option value="url">url</option>
                  <option value="local">local</option>
                </select>
              </label>
              <label className={styles.structuredEditorLabel}>
                图标地址
                <input
                  className={styles.structuredEditorInput}
                  value={item.favicon?.value || ""}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = {
                      ...item,
                      favicon: {
                        type: item.favicon?.type || "auto",
                        value: event.target.value,
                      },
                    };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorActions}>
              <button
                type="button"
                className={styles.structuredEditorButtonDanger}
                onClick={() => {
                  const next = parsed.items.filter((_, rowIndex) => rowIndex !== index);
                  commit(next);
                }}
              >
                删除该项
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.structuredEditorButton}
        onClick={() => {
          commit([
            ...parsed.items,
            {
              id: "",
              name: { zh: "", en: "" },
              desc: { zh: "", en: "" },
              url: "",
              favicon: { type: "auto", value: "" },
            },
          ]);
        }}
      >
        新增导航项
      </button>
    </div>
  );
}

/**
 * 友链配置编辑器主体。
 *
 * @param props 组件参数
 * @returns 编辑节点
 */
function FriendLinksEditorBody({ value, onChange }: StructuredEditorProps) {
  const parsed = useMemo(() => parseFriendLinks(value), [value]);

  /**
   * 提交友链列表变更。
   *
   * @param nextItems 新的友链列表
   */
  const commit = (nextItems: FriendLinkItem[]) => {
    onChange(toJson(nextItems));
  };

  return (
    <div className={styles.structuredEditor}>
      {parsed.error ? <div className={styles.structuredEditorHint}>{parsed.error}</div> : null}
      <div className={styles.structuredEditorList}>
        {parsed.items.map((item, index) => (
          <div key={`${item.title || "link"}-${index}`} className={styles.structuredEditorCard}>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                标题
                <input
                  className={styles.structuredEditorInput}
                  value={item.title}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, title: event.target.value };
                    commit(next);
                  }}
                />
              </label>
              <label className={styles.structuredEditorLabel}>
                副标题
                <input
                  className={styles.structuredEditorInput}
                  value={item.subtitle || ""}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, subtitle: event.target.value };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorRow}>
              <label className={styles.structuredEditorLabel}>
                链接
                <input
                  className={styles.structuredEditorInput}
                  value={item.link}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, link: event.target.value };
                    commit(next);
                  }}
                />
              </label>
              <label className={styles.structuredEditorLabel}>
                头像地址
                <input
                  className={styles.structuredEditorInput}
                  value={item.avatar}
                  onChange={(event) => {
                    const next = [...parsed.items];
                    next[index] = { ...item, avatar: event.target.value };
                    commit(next);
                  }}
                />
              </label>
            </div>
            <div className={styles.structuredEditorActions}>
              <button
                type="button"
                className={styles.structuredEditorButtonDanger}
                onClick={() => {
                  const next = parsed.items.filter((_, rowIndex) => rowIndex !== index);
                  commit(next);
                }}
              >
                删除该项
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.structuredEditorButton}
        onClick={() => {
          commit([
            ...parsed.items,
            {
              title: "",
              subtitle: "",
              link: "",
              avatar: "",
            },
          ]);
        }}
      >
        新增友链项
      </button>
    </div>
  );
}

/**
 * 渲染编辑器头部摘要信息。
 *
 * @param kind 编辑器类型
 * @param value 当前 JSON 字符串
 * @returns 摘要信息
 */
function resolveSummary(kind: StructuredEditorKind, value: string): { count: number; error: string; title: string } {
  if (kind === "navigation") {
    const parsed = parseNavigationItems(value);
    return { count: parsed.items.length, error: parsed.error, title: "首页导航数据" };
  }
  const parsed = parseFriendLinks(value);
  return { count: parsed.items.length, error: parsed.error, title: "友链数据" };
}

/**
 * 结构化配置编辑器入口。
 *
 * 采用默认折叠 + 二级弹窗编辑，避免主页面长列表常驻展开。
 *
 * @param props 组件参数
 * @returns 对应配置键的编辑器
 */
export function StructuredConfigEditor({ configKey, value, onChange }: StructuredConfigEditorProps) {
  const editorKind = resolveStructuredEditorKind(configKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftValue, setDraftValue] = useState("");

  if (!editorKind) {
    return null;
  }

  const summary = resolveSummary(editorKind, value);

  /**
   * 打开二级弹窗。
   */
  const handleOpen = () => {
    setDraftValue(value);
    setIsModalOpen(true);
  };

  /**
   * 关闭二级弹窗并放弃本次修改。
   */
  const handleCancel = () => {
    setIsModalOpen(false);
    setDraftValue("");
  };

  /**
   * 确认保存弹窗内修改。
   */
  const handleConfirm = () => {
    onChange(draftValue);
    setIsModalOpen(false);
    setDraftValue("");
  };

  return (
    <>
      <div className={styles.structuredCollapsed}>
        <div className={styles.structuredCollapsedInfo}>
          <span className={styles.structuredCollapsedTitle}>{summary.title}</span>
          <span className={styles.structuredCollapsedMeta}>当前共 {summary.count} 项</span>
          {summary.error ? <span className={styles.structuredCollapsedWarn}>{summary.error}</span> : null}
        </div>
        <button type="button" className={styles.structuredOpenButton} onClick={handleOpen}>
          打开二级编辑
        </button>
      </div>

      {isModalOpen && (
        <div className={styles.structuredModalMask} onClick={handleCancel}>
          <div className={styles.structuredModalPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.structuredModalHeader}>
              <h3 className={styles.structuredModalTitle}>{summary.title}编辑器</h3>
              <button type="button" className={styles.structuredModalClose} onClick={handleCancel}>
                关闭
              </button>
            </div>
            <div className={styles.structuredModalBody}>
              {editorKind === "navigation" ? (
                <NavigationItemsEditorBody value={draftValue} onChange={setDraftValue} />
              ) : (
                <FriendLinksEditorBody value={draftValue} onChange={setDraftValue} />
              )}
            </div>
            <div className={styles.structuredModalFooter}>
              <button type="button" className={styles.structuredModalButtonSecondary} onClick={handleCancel}>
                取消
              </button>
              <button type="button" className={styles.structuredModalButtonPrimary} onClick={handleConfirm}>
                确认并应用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
