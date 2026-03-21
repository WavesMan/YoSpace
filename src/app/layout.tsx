import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Header from "@/components/Common/Header/Header";
import ClientShell from "@/components/Common/ClientShell";
import { I18nProvider } from "@/context/I18nContext";

const themeInitScript = `
  (() => {
    try {
      const saved = window.localStorage.getItem('theme');
      const hasSaved = saved === 'light' || saved === 'dark';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = hasSaved ? saved : prefersDark ? 'dark' : 'light';

      if (!hasSaved) {
        window.localStorage.setItem('theme', theme);
      }

      document.body.className = theme;
      document.body.setAttribute('data-theme', theme);
    } catch (e) {
    }
  })();
`;

const localeInitScript = `
  (() => {
    try {
      const flag = ${JSON.stringify(process.env.NEXT_PUBLIC_I18N ?? "")};
      const isEnabled = !flag || flag === 'true';
      if (!isEnabled) {
        const titleZh = ${JSON.stringify(process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace")};
        if (titleZh) {
          document.title = titleZh;
        }
        return;
      }

      const saved = window.localStorage.getItem('locale');
      const browserLang = (window.navigator.language || '').toLowerCase();
      const locale = saved === 'zh-CN' || saved === 'en-US'
        ? saved
        : browserLang.startsWith('en')
          ? 'en-US'
          : 'zh-CN';

      if (saved !== locale) {
        window.localStorage.setItem('locale', locale);
      }
      document.cookie = 'locale=' + locale + '; path=/; max-age=31536000; samesite=lax';
      document.documentElement.lang = locale;

      const titleZh = ${JSON.stringify(process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace")};
      const titleEn = ${JSON.stringify(process.env.NEXT_PUBLIC_SITE_TITLE_EN || process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace")};

      if (locale === 'en-US' && titleEn) {
        document.title = titleEn;
      } else if (titleZh) {
        document.title = titleZh;
      }
    } catch (e) {
    }
  })();
`;

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "从群众出发，扎根群众。向前，无限进步",
  // icons 由 src/app/icon.tsx 自动生成，支持圆形裁剪
};

/**
 *
 * RootLayout 组件
 *
 * 根据 cookie 与请求头推断首屏语言，避免首屏语言闪烁。
 *
 * @param children 页面内容节点
 * @returns 应用根布局结构
 *
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value;
  const requestHeaders = await headers();
  const acceptLang = requestHeaders.get('accept-language')?.toLowerCase() || '';
  const htmlLang = savedLocale === 'en-US'
    ? 'en-US'
    : savedLocale === 'zh-CN'
      ? 'zh-CN'
      : acceptLang.startsWith('en')
        ? 'en-US'
        : 'zh-CN';
  return (
    <html lang={htmlLang}>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <I18nProvider>
          <Header />
          <main style={{ minHeight: '100vh' }}>
            {children}
          </main>
          <ClientShell />
        </I18nProvider>
      </body>
    </html>
  );
}
