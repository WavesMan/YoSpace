import { getDbClient } from "@/server/db/client";
import {
  RUNTIME_CONFIG_DEFINITIONS,
  RUNTIME_CONFIG_MAP,
  type RuntimeConfigDefinition,
  type RuntimeConfigType,
} from "@/server/runtime-config/registry";

type RuntimeConfigValue = string | number | boolean;

interface RuntimeConfigCacheItem {
  expiresAt: number;
  value: RuntimeConfigValue;
}

const CACHE_TTL_MS = 5000;
const runtimeConfigCache = new Map<string, RuntimeConfigCacheItem>();

/**
 * 规范化后台入口路径。
 *
 * 仅允许以 `/` 开头的相对路径，禁止空值与危险字符。
 *
 * @param raw 原始路径
 * @returns 规范化后的路径
 */
export function normalizeAdminEntryPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("后台入口路径不能为空");
  }
  if (!trimmed.startsWith("/")) {
    throw new Error("后台入口路径必须以 / 开头");
  }
  if (trimmed.length > 64) {
    throw new Error("后台入口路径长度不能超过 64");
  }
  if (!/^\/[a-zA-Z0-9\-/]*$/.test(trimmed)) {
    throw new Error("后台入口路径仅允许字母、数字、-、/ 组合");
  }
  if (trimmed.includes("//")) {
    throw new Error("后台入口路径不允许连续斜杠");
  }
  if (trimmed !== "/" && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

/**
 * 按配置类型解析值。
 *
 * @param type 配置类型
 * @param raw 原始值
 * @returns 解析后的值
 */
function parseByType(type: RuntimeConfigType, raw: unknown): RuntimeConfigValue {
  if (type === "boolean") {
    if (typeof raw === "boolean") {
      return raw;
    }
    if (typeof raw === "string") {
      if (raw === "true") return true;
      if (raw === "false") return false;
    }
    throw new Error("布尔值仅允许 true/false");
  }

  if (type === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.floor(raw);
    }
    if (typeof raw === "string") {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    throw new Error("数字值格式非法");
  }

  if (typeof raw !== "string") {
    throw new Error("字符串值格式非法");
  }
  return raw;
}

/**
 * 对单个配置值进行业务校验。
 *
 * @param definition 配置定义
 * @param value 待校验值
 */
function validateBusinessRule(definition: RuntimeConfigDefinition, value: RuntimeConfigValue): void {
  if (definition.key === "NEXT_PUBLIC_ADMIN_PATH") {
    normalizeAdminEntryPath(String(value));
    return;
  }

  if (definition.key === "NEXT_PUBLIC_DEFAULT_LOCALE") {
    if (value !== "zh-CN" && value !== "en-US") {
      throw new Error("默认语言仅支持 zh-CN 或 en-US");
    }
    return;
  }

  if (definition.key === "NEXT_PUBLIC_BLOG_MODE") {
    if (value !== "internal" && value !== "external") {
      throw new Error("博客模式仅支持 internal 或 external");
    }
    return;
  }

  if (definition.key === "NEXT_PUBLIC_BLOG_ITEMS_PER_PAGE") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 200) {
      throw new Error("博客分页大小范围必须在 1 到 200");
    }
    return;
  }

  if (definition.key === "NEXT_PUBLIC_BLOG_TAGS_MAX_VISIBLE") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 20) {
      throw new Error("标签最大展示数范围必须在 1 到 20");
    }
    return;
  }

  if (definition.key === "NEXT_PUBLIC_BLOG_RELATED_LIMIT") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 500) {
      throw new Error("关联文章拉取上限范围必须在 1 到 500");
    }
    return;
  }
}

/**
 * 读取单个运行时配置。
 *
 * @param key 配置键
 * @returns 配置值
 */
export async function getRuntimeConfigValue(key: string): Promise<RuntimeConfigValue> {
  const definition = RUNTIME_CONFIG_MAP.get(key);
  if (!definition) {
    throw new Error(`未知配置键: ${key}`);
  }

  const now = Date.now();
  const cached = runtimeConfigCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const db = getDbClient();
  const record = await db.systemConfig.findUnique({
    where: { key },
    select: { value: true },
  });

  let resolved: RuntimeConfigValue;
  if (record && record.value !== null && record.value !== undefined) {
    resolved = parseByType(definition.type, record.value);
    validateBusinessRule(definition, resolved);
  } else {
    resolved = definition.defaultValue as RuntimeConfigValue;
  }

  runtimeConfigCache.set(key, {
    value: resolved,
    expiresAt: now + CACHE_TTL_MS,
  });

  return resolved;
}

/**
 * 批量读取运行时配置。
 *
 * @param keys 目标键列表
 * @returns 配置键值映射
 */
export async function getRuntimeConfigValues(keys: string[]): Promise<Record<string, RuntimeConfigValue>> {
  const uniqueKeys = Array.from(new Set(keys));
  const resolvedEntries = await Promise.all(
    uniqueKeys.map(async (key) => {
      const value = await getRuntimeConfigValue(key);
      return [key, value] as const;
    }),
  );
  return Object.fromEntries(resolvedEntries);
}

/**
 * 读取公开配置集合。
 *
 * @returns 可安全暴露给浏览器的配置
 */
export async function getPublicRuntimeConfig(): Promise<Record<string, RuntimeConfigValue>> {
  const publicKeys = RUNTIME_CONFIG_DEFINITIONS.filter(item => item.isPublic).map(item => item.key);
  return getRuntimeConfigValues(publicKeys);
}

/**
 * 读取全部配置集合。
 *
 * @returns 全量配置键值映射
 */
export async function getAllRuntimeConfig(): Promise<Record<string, RuntimeConfigValue>> {
  return getRuntimeConfigValues(RUNTIME_CONFIG_DEFINITIONS.map(item => item.key));
}

/**
 * 写入单个运行时配置。
 *
 * @param key 配置键
 * @param rawValue 原始值
 */
export async function setRuntimeConfigValue(key: string, rawValue: unknown): Promise<void> {
  const definition = RUNTIME_CONFIG_MAP.get(key);
  if (!definition) {
    throw new Error(`未知配置键: ${key}`);
  }

  const parsed = parseByType(definition.type, rawValue);
  validateBusinessRule(definition, parsed);

  const db = getDbClient();
  await db.systemConfig.upsert({
    where: { key },
    update: { value: parsed as never },
    create: { key, value: parsed as never },
  });

  runtimeConfigCache.delete(key);
}

/**
 * 批量写入运行时配置。
 *
 * @param payload 待写入的键值映射
 */
export async function setRuntimeConfigValues(payload: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(payload);
  for (const [key, value] of entries) {
    await setRuntimeConfigValue(key, value);
  }
}

/**
 * 清理运行时配置缓存。
 */
export function clearRuntimeConfigCache(): void {
  runtimeConfigCache.clear();
}

/**
 * 获取后台入口路径。
 *
 * @returns 当前后台入口
 */
export async function getAdminEntryPath(): Promise<string> {
  const value = await getRuntimeConfigValue("NEXT_PUBLIC_ADMIN_PATH");
  return normalizeAdminEntryPath(String(value));
}
