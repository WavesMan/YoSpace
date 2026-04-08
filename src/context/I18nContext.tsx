"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, ReactNode, useState } from "react";
import zhCN from "../locales/zh_CN.json";
import enUS from "../locales/en_US.json";
import { useRuntimePublicConfig } from "@/context/RuntimePublicConfigContext";

type Locale = "zh-CN" | "en-US";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const DEFAULT_LOCALE: Locale = "zh-CN";

const flattenObject = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
  return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
    const pre = prefix.length ? `${prefix}.` : "";
    const value = obj[k];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value as Record<string, unknown>, pre + k));
    } else {
      acc[pre + k] = typeof value === "string" ? value : String(value ?? "");
    }
    return acc;
  }, {});
};

const readPreferredLocale = (enabled: boolean): Locale => {
  if (!enabled || typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const saved = window.localStorage.getItem("locale");
  if (saved === "zh-CN" || saved === "en-US") {
    return saved;
  }
  const browserLocale = window.navigator.language?.toLowerCase() || "";
  return browserLocale.startsWith("en") ? "en-US" : "zh-CN";
};

/**
 * i18n 上下文 Provider。
 * 语言开关、默认标题和持久化行为统一基于 Runtime Public Config。
 */
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const runtimeConfig = useRuntimePublicConfig();
  const i18nEnabled = runtimeConfig.NEXT_PUBLIC_I18N;
  const [localeState, setLocaleState] = useState<Locale>(() => readPreferredLocale(i18nEnabled));
  const locale = i18nEnabled ? localeState : DEFAULT_LOCALE;

  const translations = useMemo(() => (locale === "en-US" ? enUS : zhCN), [locale]);
  const flattenedTranslations = useMemo(
    () => flattenObject(translations as unknown as Record<string, unknown>),
    [translations],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "locale") return;
      const nextLocale = readPreferredLocale(i18nEnabled);
      setLocaleState(nextLocale);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [i18nEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    document.documentElement.lang = locale;
    const title =
      locale === "en-US"
        ? (runtimeConfig.NEXT_PUBLIC_SITE_TITLE_EN || runtimeConfig.NEXT_PUBLIC_SITE_TITLE)
        : runtimeConfig.NEXT_PUBLIC_SITE_TITLE;
    if (title) {
      document.title = title;
    }
  }, [locale, runtimeConfig]);

  /**
   * 切换当前 UI 语言并同步到本地持久化。
   * @param nextLocale 目标语言
   */
  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (!i18nEnabled) return;
      setLocaleState(nextLocale);
      if (typeof window === "undefined") return;
      window.localStorage.setItem("locale", nextLocale);
      document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    },
    [i18nEnabled],
  );

  /**
   * 翻译键值查询函数。
   * @param key 翻译键
   * @returns 文案值或原键
   */
  const t = useCallback(
    (key: string): string => {
      return flattenedTranslations[key] || key;
    },
    [flattenedTranslations],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
};

/**
 * 读取 i18n 上下文。
 * @returns i18n context
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
