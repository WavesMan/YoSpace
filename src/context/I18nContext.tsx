'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, ReactNode, useSyncExternalStore } from 'react';
import zhCN from '../locales/zh_CN.json';
import enUS from '../locales/en_US.json';

// 定义支持的语言
type Locale = 'zh-CN' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 扁平化对象的辅助函数，用于支持 'Category.Key' 格式的键
const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    const value = obj[k];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value as Record<string, unknown>, pre + k));
    } else {
      acc[pre + k] = typeof value === 'string' ? value : String(value ?? '');
    }
    return acc;
  }, {});
};

const DEFAULT_LOCALE: Locale = 'zh-CN';

const isI18nEnabled = () => {
  return process.env.NEXT_PUBLIC_I18N === 'true';
};

const readPreferredLocale = (): Locale => {
  if (!isI18nEnabled()) return DEFAULT_LOCALE;
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const savedLocale = window.localStorage.getItem('locale');
  if (savedLocale === 'zh-CN' || savedLocale === 'en-US') {
    return savedLocale;
  }

  const browserLocale = window.navigator.language?.toLowerCase() || '';
  return browserLocale.startsWith('en') ? 'en-US' : 'zh-CN';
};

let localeSnapshot: Locale = DEFAULT_LOCALE;

const localeListeners = new Set<() => void>();

const emitLocaleChange = () => {
  localeListeners.forEach((listener) => listener());
};

const setLocaleSnapshot = (nextLocale: Locale) => {
  if (localeSnapshot === nextLocale) return;
  localeSnapshot = nextLocale;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('locale', nextLocale);
  }

  emitLocaleChange();
};

const onStorage = (event: StorageEvent) => {
  if (event.key !== 'locale') return;
  setLocaleSnapshot(readPreferredLocale());
};

const subscribeLocale = (listener: () => void) => {
  localeListeners.add(listener);

  if (localeListeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    localeListeners.delete(listener);
    if (localeListeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
};

const getLocaleSnapshot = () => localeSnapshot;
const getLocaleServerSnapshot = () => DEFAULT_LOCALE;

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // 默认语言逻辑
  // 1. 检查环境变量 NEXT_PUBLIC_I18N
  // 2. 如果开启，检查 localStorage
  // 3. 检查 navigator.language
  // 4. 默认 zh-CN

  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);
  const translations = useMemo(() => (locale === 'en-US' ? enUS : zhCN), [locale]);
  const flattenedTranslations = useMemo(() => {
    return flattenObject(translations as unknown as Record<string, unknown>);
  }, [translations]);

  useEffect(() => {
    setLocaleSnapshot(readPreferredLocale());
  }, []);

  useEffect(() => {
    // 设置 html lang 属性
    document.documentElement.lang = locale;

    // 更新页面标题
    const siteTitle = locale === 'en-US'
      ? (process.env.NEXT_PUBLIC_SITE_TITLE_EN || process.env.NEXT_PUBLIC_SITE_TITLE)
      : process.env.NEXT_PUBLIC_SITE_TITLE;
    
    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!isI18nEnabled()) return;
    setLocaleSnapshot(newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    return flattenedTranslations[key] || key;
  }, [flattenedTranslations]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
