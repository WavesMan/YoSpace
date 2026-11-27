import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Header from "@/components/Common/Header/Header";
import ClientShell from "@/components/Common/ClientShell";
import { I18nProvider } from "@/context/I18nContext";
import PageReadiness from "@/components/Common/PageReadiness";
import { resolveRequestLocale } from '@/utils/requestLocale';
import { seoConfig } from '@/utils/seo';
import { themeInitScript } from '@/utils/theme';

const localeInitScript = `
  (() => {
    try {
      const flag = ${JSON.stringify(process.env.NEXT_PUBLIC_I18N ?? "")};
      const isEnabled = !flag || flag === 'true';
      if (!isEnabled) return;

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

    } catch (e) {
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: seoConfig.defaultTitle,
  description: seoConfig.defaultDescription,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.BING_SITE_VERIFICATION && { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }),
      ...(process.env.BAIDU_SITE_VERIFICATION && { 'baidu-site-verification': process.env.BAIDU_SITE_VERIFICATION }),
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "16x16",
        type: "image/x-icon",
      },
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/icon-64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        url: "/icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/icon",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
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
  let htmlLang: 'zh-CN' | 'en-US' = 'zh-CN';
  if (process.env.NEXT_PUBLIC_I18N !== 'false') {
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
    htmlLang = resolveRequestLocale(cookieStore.get('locale')?.value, requestHeaders.get('accept-language') || '');
  }
  const rssFeedPath = process.env.NEXT_PUBLIC_RSS_FEED_PATH || "/feeds/rss.xml";
  const atomFeedPath = process.env.NEXT_PUBLIC_ATOM_FEED_PATH || "/feeds/atom.xml";

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="alternate" type="application/rss+xml" href={rssFeedPath} title="RSS订阅" />
        <link rel="alternate" type="application/atom+xml" href={atomFeedPath} title="ATOM订阅" />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <I18nProvider initialLocale={htmlLang}>
          <Header />
          <PageReadiness>
          <main style={{ minHeight: '100vh' }}>
            {children}
          </main>
          </PageReadiness>
          <ClientShell />
        </I18nProvider>
      </body>
    </html>
  );
}
