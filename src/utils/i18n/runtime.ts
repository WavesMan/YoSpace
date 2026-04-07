export type UiLocale = "zh-CN" | "en-US";
export type ContentLocale = "zh-CN" | "en";

interface I18nRuntimeConfig {
  enabled: boolean;
  defaultUiLocale: UiLocale;
  supportedUiLocales: UiLocale[];
}

/**
 * 解析 i18n 运行时配置
 *
 * 根据环境变量输出当前是否开启多语、默认语种与支持语种。
 *
 * @returns i18n 运行时配置
 */
export function resolveI18nRuntimeConfig(): I18nRuntimeConfig {
  const enabled = process.env.NEXT_PUBLIC_I18N !== "false";
  const defaultUiLocaleRaw = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  const defaultUiLocale: UiLocale = defaultUiLocaleRaw === "en-US" ? "en-US" : "zh-CN";

  const rawSupported = process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "zh-CN,en-US";
  const tokens = rawSupported
    .split(",")
    .map(token => token.trim())
    .filter(Boolean);
  const normalized: UiLocale[] = [];
  for (const token of tokens) {
    if ((token === "zh-CN" || token === "en-US") && !normalized.includes(token)) {
      normalized.push(token);
    }
  }
  const supportedUiLocales: UiLocale[] = normalized.length > 0 ? normalized : (["zh-CN", "en-US"] as UiLocale[]);

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
 * 将 UI 语种转换为内容存储语种
 *
 * @param locale UI 语种
 * @returns 内容存储语种
 */
export function toContentLocale(locale: UiLocale): ContentLocale {
  return locale === "en-US" ? "en" : "zh-CN";
}

/**
 * 将内容存储语种转换为 UI 语种
 *
 * @param locale 内容存储语种
 * @returns UI 语种
 */
export function toUiLocale(locale: string): UiLocale {
  if (locale === "en" || locale === "en-US") {
    return "en-US";
  }
  return "zh-CN";
}

/**
 * 归一化请求中的 UI 语种
 *
 * @param rawLocale 原始语种值
 * @returns 归一化后的 UI 语种
 */
export function normalizeUiLocale(rawLocale: string | null | undefined): UiLocale {
  if (rawLocale === "en-US" || rawLocale === "en") {
    return "en-US";
  }
  return "zh-CN";
}

/**
 * 解析可用于内容查询的语种
 *
 * i18n 关闭时始终返回默认语种，忽略外部传入值。
 *
 * @param rawLocale 原始语种值
 * @returns 内容存储语种
 */
export function resolveContentLocale(rawLocale: string | null | undefined): ContentLocale {
  const config = resolveI18nRuntimeConfig();
  if (!config.enabled) {
    return toContentLocale(config.defaultUiLocale);
  }
  const uiLocale = normalizeUiLocale(rawLocale);
  return toContentLocale(uiLocale);
}

/**
 * 获取后台可编辑语种列表
 *
 * @returns 后台可编辑 UI 语种集合
 */
export function resolveAdminEditableUiLocales(): UiLocale[] {
  const config = resolveI18nRuntimeConfig();
  return config.supportedUiLocales;
}
