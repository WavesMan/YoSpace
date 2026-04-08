import {
  DEFAULT_RUNTIME_PUBLIC_CONFIG,
  parseSupportedUiLocales,
  type RuntimePublicConfig,
} from "@/config/runtimePublicConfig";

export type UiLocale = "zh-CN" | "en-US";
export type ContentLocale = "zh-CN" | "en";

interface I18nRuntimeConfig {
  enabled: boolean;
  defaultUiLocale: UiLocale;
  supportedUiLocales: UiLocale[];
}

type I18nRuntimeConfigSource = Pick<
  RuntimePublicConfig,
  "NEXT_PUBLIC_I18N" | "NEXT_PUBLIC_DEFAULT_LOCALE" | "NEXT_PUBLIC_SUPPORTED_LOCALES"
>;

/**
 * 解析 i18n 运行时配置。
 * @param source 可选运行时配置来源
 * @returns i18n 配置快照
 */
export function resolveI18nRuntimeConfig(source?: Partial<I18nRuntimeConfigSource>): I18nRuntimeConfig {
  const fallback = DEFAULT_RUNTIME_PUBLIC_CONFIG;
  const enabled = source?.NEXT_PUBLIC_I18N ?? fallback.NEXT_PUBLIC_I18N;
  const defaultUiLocaleRaw = source?.NEXT_PUBLIC_DEFAULT_LOCALE ?? fallback.NEXT_PUBLIC_DEFAULT_LOCALE;
  const defaultUiLocale: UiLocale = defaultUiLocaleRaw === "en-US" ? "en-US" : "zh-CN";
  const rawSupported = source?.NEXT_PUBLIC_SUPPORTED_LOCALES ?? fallback.NEXT_PUBLIC_SUPPORTED_LOCALES;
  const supportedUiLocales = parseSupportedUiLocales(rawSupported);

  if (!enabled) {
    return {
      enabled: false,
      defaultUiLocale,
      supportedUiLocales: [defaultUiLocale],
    };
  }

  return {
    enabled: true,
    defaultUiLocale,
    supportedUiLocales,
  };
}

/**
 * 将 UI 语言转换为内容存储语言。
 * @param locale UI 语言
 * @returns 内容存储语言
 */
export function toContentLocale(locale: UiLocale): ContentLocale {
  return locale === "en-US" ? "en" : "zh-CN";
}

/**
 * 将内容语言映射为 UI 语言。
 * @param locale 内容语言
 * @returns UI 语言
 */
export function toUiLocale(locale: string): UiLocale {
  if (locale === "en" || locale === "en-US") {
    return "en-US";
  }
  return "zh-CN";
}

/**
 * 规范化外部输入的 UI 语言值。
 * @param rawLocale 原始语言
 * @returns 规范化 UI 语言
 */
export function normalizeUiLocale(rawLocale: string | null | undefined): UiLocale {
  if (rawLocale === "en-US" || rawLocale === "en") {
    return "en-US";
  }
  return "zh-CN";
}

/**
 * 解析用于内容查询的语言值。
 * @param rawLocale 原始语言
 * @param source 可选运行时配置来源
 * @returns 内容存储语言
 */
export function resolveContentLocale(
  rawLocale: string | null | undefined,
  source?: Partial<I18nRuntimeConfigSource>,
): ContentLocale {
  const config = resolveI18nRuntimeConfig(source);
  if (!config.enabled) {
    return toContentLocale(config.defaultUiLocale);
  }
  const uiLocale = normalizeUiLocale(rawLocale);
  return toContentLocale(uiLocale);
}

/**
 * 获取后台可编辑的 UI 语言列表。
 * @param source 可选运行时配置来源
 * @returns 语言列表
 */
export function resolveAdminEditableUiLocales(source?: Partial<I18nRuntimeConfigSource>): UiLocale[] {
  const config = resolveI18nRuntimeConfig(source);
  return config.supportedUiLocales;
}
