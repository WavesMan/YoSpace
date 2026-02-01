'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import zhCN from '../locales/zh_CN.json';
import enUS from '../locales/en_US.json';

// 定义翻译文件类型
type Translations = typeof zhCN;

// 定义支持的语言
type Locale = 'zh-CN' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 扁平化对象的辅助函数，用于支持 'Category.Key' 格式的键
const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // 默认语言逻辑
  // 1. 检查环境变量 NEXT_PUBLIC_I18N
  // 2. 如果开启，检查 localStorage
  // 3. 检查 navigator.language
  // 4. 默认 zh-CN

  const [locale, setLocaleState] = useState<Locale>('zh-CN');
  const [translations, setTranslations] = useState<Translations>(zhCN);
  const [flattenedTranslations, setFlattenedTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const i18nEnabled = process.env.NEXT_PUBLIC_I18N === 'true';
    let initialLocale: Locale = 'zh-CN';

    if (i18nEnabled) {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && (savedLocale === 'zh-CN' || savedLocale === 'en-US')) {
        initialLocale = savedLocale;
      } else if (typeof navigator !== 'undefined') {
        if (navigator.language.toLowerCase().startsWith('en')) {
          initialLocale = 'en-US';
        } else {
          initialLocale = 'zh-CN';
        }
      }
    }

    setLocaleState(initialLocale);
  }, []);

  useEffect(() => {
    const newTranslations = locale === 'en-US' ? enUS : zhCN;
    setTranslations(newTranslations);
    setFlattenedTranslations(flattenObject(newTranslations));
    localStorage.setItem('locale', locale);
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

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: string): string => {
    return flattenedTranslations[key] || key;
  };

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
